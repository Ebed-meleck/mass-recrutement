import axios from 'axios';
import debug from 'debug';
import 'dotenv/config';
import db from './db';


const log = debug('ODK:SYSTEM');
const logError = debug('ODK:SYSTEM:ERROR');

// const formId = 'fm_gc7_eq_form_test_sup_independant.svc';
// const projectId = 3;


const odkUser = process.env.ODK_USER;
const odkPass = process.env.ODK_PASS;

export const getSubmission = async (projectId, formId, startAt, endAt) => {
  const dateFilter = `$filter=__system/submissionDate gt ${startAt} and __system/submissionDate lt ${endAt}`;
  const odkUrl = `https://central.ima-data.com/v1/projects/${projectId}/forms/${formId}.svc/Submissions`;

  const response = await axios.get(encodeURI(`${odkUrl}?${dateFilter}`), {
    auth: {
      username: odkUser,
      password: odkPass
    }
  });
  return response.data?.value;
};


export const downloadFormInDataDb = async () => {
  try {
    const sql = `SELECT * FROM form WHERE pause=$1;`;
    const forms = await db.any(sql, [false]);

    if (!forms.length) {
      log('NONE FORM FOUND');
      return;
    }

    log('Downloading data from ODK central');
    let totalInserted = 0;
    let totalSkipped = 0;

    for await (const form of forms) {
      log('DOWNLOADING FORM::', form.form_id);
      const startAt = form.last_submission_date || new Date(2000, 0, 1);
      const endAt = new Date();
      
      const submissions = await getSubmission(
        form.project_id, 
        form.form_id, 
        startAt.toISOString(), 
        endAt.toISOString()
      );

      if (!submissions || submissions.length === 0) {
        log(`Aucune soumission trouvée pour le formulaire ${form.form_id}`);
        continue;
      }

      // Préparer les données pour l'insertion en lot
      const submissionsToInsert = [];
      const existingInstanceIds = new Set();

      // Récupérer les instanceID existants pour ce formulaire
      const existingQuery = `
        SELECT DISTINCT odk_instance_id 
        FROM form_data 
        WHERE form_id = $1 AND odk_instance_id IS NOT NULL
      `;
      const existingRecords = await db.any(existingQuery, [form.form_id]);
      existingRecords.forEach(record => existingInstanceIds.add(record.odk_instance_id));

      // Filtrer les nouvelles soumissions
      for (const submission of submissions) {
        const instanceId = submission.instanceID || submission.__id || `${form.form_id}_${Date.now()}_${Math.random()}`;
        
        if (!existingInstanceIds.has(instanceId)) {
          submissionsToInsert.push({
            form_id: form.form_id,
            data: submission,
            odk_instance_id: instanceId,
            created_at: new Date()
          });
        }
      }

      if (submissionsToInsert.length === 0) {
        log(`Aucune nouvelle soumission pour le formulaire ${form.form_id}`);
        totalSkipped += submissions.length;
        continue;
      }

      try {
        // Insertion en lot avec pg-promise helpers
        const columnSet = new db.$config.pgp.helpers.ColumnSet([
          'form_id', 
          'data:json', 
          'odk_instance_id', 
          'created_at'
        ], {table: 'form_data'});

        const insertQuery = db.$config.pgp.helpers.insert(submissionsToInsert, columnSet) + 
          ' ON CONFLICT (form_id, odk_instance_id) DO NOTHING RETURNING id';

        const insertedRecords = await db.any(insertQuery);
        
        const formInserted = insertedRecords.length;
        const formSkipped = submissions.length - formInserted;

        totalInserted += formInserted;
        totalSkipped += formSkipped;

        log(`FORM ${form.form_id}: ${formInserted} nouvelles soumissions, ${formSkipped} ignorées`);

        // Mettre à jour la date de dernière soumission
        await db.none(
          `UPDATE form SET last_submission_date = $1 WHERE form_id = $2`,
          [endAt, form.form_id]
        );

      } catch (error) {
        logError(`Erreur lors de l'insertion en lot pour ${form.form_id}:`, error);
        
        // Fallback: insertion ligne par ligne en cas d'erreur
        let fallbackInserted = 0;
        for (const submissionData of submissionsToInsert) {
          try {
            const result = await db.oneOrNone(
              `INSERT INTO form_data (form_id, data, odk_instance_id, created_at) 
               VALUES ($1, $2, $3, $4) 
               ON CONFLICT (form_id, odk_instance_id) DO NOTHING 
               RETURNING id`,
              [submissionData.form_id, submissionData.data, submissionData.odk_instance_id, submissionData.created_at]
            );
            if (result) fallbackInserted++;
          } catch (individualError) {
            logError(`Erreur insertion individuelle:`, individualError);
          }
        }
        
        totalInserted += fallbackInserted;
        totalSkipped += (submissionsToInsert.length - fallbackInserted);
        log(`FORM ${form.form_id} (fallback): ${fallbackInserted} soumissions insérées`);
      }
    }

    log(`TÉLÉCHARGEMENT TERMINÉ: ${totalInserted} nouvelles soumissions, ${totalSkipped} doublons/erreurs ignorés`);

  } catch (error) {
    logError('Erreur générale lors du téléchargement:', error);
  }
}

export const extractInput = async () => {
  const sql = `
  DO $$
DECLARE
    processed_count INTEGER := 0;
    rec RECORD;
    fiche JSONB;
BEGIN
    FOR rec IN 
        SELECT DISTINCT fd.id, fd.data, fd.form_id 
        FROM form_data fd
        LEFT JOIN candidate c ON c.form_data_id = fd.id
        WHERE c.id IS NULL  -- Seulement les nouveaux form_data
    LOOP
        fiche := rec.data->'fiche_id';

        INSERT INTO candidate (
            form_data_id,
            nom, post_nom, prenom, sexe, date_naissance, telephone, email,
            province_origine, nationalite, niveau_etudes, adresse_physique, 
            experience_ima, zone_provenance, total_score, pourcentage
        ) VALUES (
            rec.id,
            fiche->>'nom',
            fiche->>'post_nom',
            fiche->>'prenom',
            fiche->>'sexe',
            fiche->>'date_naissance',
            fiche->>'telephone',
            fiche->>'email',
            fiche->>'province_origine',
            fiche->>'nationalite',
            fiche->>'niveau_etudes',
            fiche->>'adresse_physique',
            fiche->>'experience_ima',
            fiche->>'zone_provenance',
            (rec.data->>'total_score')::NUMERIC,
            (rec.data->>'pourcentage')::NUMERIC
        )
        ON CONFLICT (form_data_id) DO UPDATE SET
            nom = EXCLUDED.nom,
            post_nom = EXCLUDED.post_nom,
            prenom = EXCLUDED.prenom,
            sexe = EXCLUDED.sexe,
            date_naissance = EXCLUDED.date_naissance,
            telephone = EXCLUDED.telephone,
            email = EXCLUDED.email,
            province_origine = EXCLUDED.province_origine,
            nationalite = EXCLUDED.nationalite,
            niveau_etudes = EXCLUDED.niveau_etudes,
            adresse_physique = EXCLUDED.adresse_physique,
            experience_ima = EXCLUDED.experience_ima,
            zone_provenance = EXCLUDED.zone_provenance,
            total_score = EXCLUDED.total_score,
            pourcentage = EXCLUDED.pourcentage;
        
        processed_count := processed_count + 1;
    END LOOP;
END $$;
  `;
  return db.none(sql);
};

export const aggregateStats = async () => {
  const sql = `
    DO $$
DECLARE
    rec RECORD;
    stats RECORD;
    la_periode TEXT := to_char(NOW(), 'YYYY-MM-DD');
    dashboard_count INTEGER := 0;
BEGIN
    -- Boucle sur chaque dashboard distinct qui a des formulaires actifs
    FOR rec IN 
        SELECT DISTINCT f.dash_id 
        FROM form f 
        WHERE f.dash_id IS NOT NULL 
          AND f.pause = FALSE
    LOOP
        -- Calculer les statistiques consolidées pour tous les formulaires du dashboard
        SELECT
            COUNT(*) AS nb_candidats,
            SUM(CASE WHEN c.pourcentage >= (SELECT seuil FROM setting WHERE id=1) THEN 1 ELSE 0 END) AS nb_admis,
            SUM(CASE WHEN c.pourcentage < (SELECT seuil FROM setting WHERE id=1) THEN 1 ELSE 0 END) AS nb_refuses,
            ROUND((SUM(CASE WHEN c.pourcentage >= (SELECT seuil FROM setting WHERE id=1) THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100)::numeric, 2) AS taux_reussite,
            ROUND(AVG(c.total_score)::numeric, 2) AS score_moyen,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.total_score) AS score_median,
            MIN(c.total_score) AS score_min,
            MAX(c.total_score) AS score_max,
            ROUND(AVG(c.pourcentage)::numeric, 2) AS pourcentage_moyen
        INTO stats
        FROM candidate c
        INNER JOIN form_data fd ON c.form_data_id = fd.id
        INNER JOIN form f ON fd.form_id = f.form_id
        WHERE f.dash_id = rec.dash_id
          AND f.pause = FALSE;
        
        -- Insérer ou mettre à jour les statistiques consolidées
        INSERT INTO form_stats (
            dash_id,
            periode,
            nb_candidats,
            nb_admis,
            nb_refuses,
            taux_reussite,
            score_moyen,
            score_median,
            score_min,
            score_max,
            pourcentage_moyen
        ) VALUES (
            rec.dash_id,
            la_periode,
            COALESCE(stats.nb_candidats, 0),
            COALESCE(stats.nb_admis, 0),
            COALESCE(stats.nb_refuses, 0),
            COALESCE(stats.taux_reussite, 0),
            COALESCE(stats.score_moyen, 0),
            COALESCE(stats.score_median, 0),
            COALESCE(stats.score_min, 0),
            COALESCE(stats.score_max, 0),
            COALESCE(stats.pourcentage_moyen, 0)
        )
        ON CONFLICT (dash_id, periode) DO UPDATE SET
            nb_candidats = EXCLUDED.nb_candidats,
            nb_admis = EXCLUDED.nb_admis,
            nb_refuses = EXCLUDED.nb_refuses,
            taux_reussite = EXCLUDED.taux_reussite,
            score_moyen = EXCLUDED.score_moyen,
            score_median = EXCLUDED.score_median,
            score_min = EXCLUDED.score_min,
            score_max = EXCLUDED.score_max,
            pourcentage_moyen = EXCLUDED.pourcentage_moyen,
            created_at = NOW();
            
        dashboard_count := dashboard_count + 1;
    END LOOP;
END $$;
  `;
  return db.none(sql);
};

export const aggregateOtherDetail = () => {
  const sql = `
    DO $$
DECLARE
    rec RECORD;
    la_periode TEXT := to_char(NOW(), 'YYYY-MM-DD');
    total_cand INTEGER;
    my_seuil NUMERIC;
BEGIN
    -- Récupérer le seuil depuis la table setting (adapte l'id si besoin)
    SELECT seuil INTO my_seuil FROM setting WHERE id = 1;

    FOR rec IN SELECT DISTINCT form_id FROM form_data LOOP
        -- Total candidats pour le form_id
        SELECT COUNT(*) INTO total_cand
        FROM candidate
        WHERE form_data_id IN (SELECT id FROM form_data WHERE form_id = rec.form_id);

        -- Répartition par sexe
        INSERT INTO form_stats_detail (form_id, dash_id, periode, sexe, nb_candidats, pourcentage)
        SELECT
            rec.form_id,
            (SELECT dash_id FROM form WHERE form_id = rec.form_id),
            la_periode,
            sexe,
            COUNT(*),
            ROUND((COUNT(*)::numeric / GREATEST(total_cand,1)) * 100, 2)
        FROM candidate
        WHERE form_data_id IN (SELECT id FROM form_data WHERE form_id = rec.form_id)
        GROUP BY sexe;

        -- Répartition par statut (admis/refusé) AVEC SEUIL DYNAMIQUE
        INSERT INTO form_stats_detail (form_id, dash_id, periode, statut, nb_candidats, pourcentage)
        SELECT
            rec.form_id,
            (SELECT dash_id FROM form WHERE form_id = rec.form_id),
            la_periode,
            CASE WHEN pourcentage >= my_seuil THEN 'admis' ELSE 'refuse' END,
            COUNT(*),
            ROUND((COUNT(*)::numeric / GREATEST(total_cand,1)) * 100, 2)
        FROM candidate
        WHERE form_data_id IN (SELECT id FROM form_data WHERE form_id = rec.form_id)
        GROUP BY CASE WHEN pourcentage >= my_seuil THEN 'admis' ELSE 'refuse' END;

        -- Répartition par tranche de score (exemple: 0-20, 21-40, ...)
        INSERT INTO form_stats_detail (form_id, dash_id, periode, tranche_score, nb_candidats, pourcentage)
        SELECT
            rec.form_id,
            (SELECT dash_id FROM form WHERE form_id = rec.form_id),
            la_periode,
            CASE
                WHEN total_score < 20 THEN '0-19'
                WHEN total_score < 40 THEN '20-39'
                WHEN total_score < 60 THEN '40-59'
                WHEN total_score < 80 THEN '60-79'
                ELSE '80+'
            END AS tranche_score,
            COUNT(*),
            ROUND((COUNT(*)::numeric / GREATEST(total_cand,1)) * 100, 2)
        FROM candidate
        WHERE form_data_id IN (SELECT id FROM form_data WHERE form_id = rec.form_id)
        GROUP BY
            CASE
                WHEN total_score < 20 THEN '0-19'
                WHEN total_score < 40 THEN '20-39'
                WHEN total_score < 60 THEN '40-59'
                WHEN total_score < 80 THEN '60-79'
                ELSE '80+'
            END;
    END LOOP;
END $$;
  `;
  return db.none(sql);
};

export const initialProcess = async () => {
  try {
    log('INITIAL PROCESS STARTED');
    await downloadFormInDataDb();
    await extractInput();
    await aggregateStats();
    await aggregateOtherDetail();
    log('INITIAL PROCESS ENDED');
  } catch (e) {
    logError('INITIAL PROCESS', e);
  }
};


