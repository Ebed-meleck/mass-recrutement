import db from '../lib/db';

export const getFormStats = async (req, res, next) => {
  try {
    const { dash_id } = req.params;
    const { periode } = req.query;
    if (!dash_id) {
      return res.status(400).json({ error: 'The identifiant dashboard is required is required' });
    }
    const sqlSeuil = `SELECT seuil FROM "setting" WHERE id=1;`;
    let sql = `
      SELECT fm.*, dh.*
      FROM form_stats fm
      JOIN "dashboard_recrutement" dh  ON dh.id = fm.dash_id
      WHERE dash_id = $1
    `;
    const params = [dash_id];
    if (periode) {
      sql += ' AND periode = $2;';
      params.push(periode);
    } else {
      sql += ' ORDER BY periode DESC;';
    }
    const stats = await db.any(sql, params);
    const seuil = await db.oneOrNone(sqlSeuil);
    res.json({ ...stats, ...seuil });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const getSubmissions = async (req, res) => {
  try {
    // Récupérer les paramètres de requête optionnels
    const { 
      form_id, 
      dash_id, 
      limit, 
      offset, 
      start_date, 
      end_date,
      include_metadata = false 
    } = req.query;

    // Construire la requête SQL dynamiquement
    let query = `
      SELECT 
        fd.id,
        fd.form_id,
        fd.data,
        fd.odk_instance_id,
        fd.created_at,
        f.name as form_name,
        f.dash_id,
        dr.name as dashboard_name
      FROM form_data fd
      LEFT JOIN form f ON fd.form_id = f.form_id
      LEFT JOIN dashboard_recrutement dr ON f.dash_id = dr.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    // Filtres optionnels
    if (form_id) {
      paramCount++;
      query += ` AND fd.form_id = $${paramCount}`;
      params.push(form_id);
    }

    if (dash_id) {
      paramCount++;
      query += ` AND f.dash_id = $${paramCount}`;
      params.push(parseInt(dash_id));
    }

    if (start_date) {
      paramCount++;
      query += ` AND fd.created_at >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND fd.created_at <= $${paramCount}`;
      params.push(end_date);
    }

    // Tri par date de création (plus récent en premier)
    query += ` ORDER BY fd.created_at DESC`;

    // Pagination
    if (limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));
    }

    if (offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset));
    }

    // Exécuter la requête
    const submissions = await db.any(query, params);

    // Consolider les données dans un seul tableau
    const consolidatedData = submissions.map(submission => {
      const baseData = {
        id: submission.id,
        form_id: submission.form_id,
        odk_instance_id: submission.odk_instance_id,
        created_at: submission.created_at,
        ...submission.data // Étaler toutes les données du JSON
      };

      // Ajouter les métadonnées si demandées
      if (include_metadata === 'true') {
        baseData._metadata = {
          form_name: submission.form_name,
          dash_id: submission.dash_id,
          dashboard_name: submission.dashboard_name
        };
      }

      return baseData;
    });

    // Obtenir le nombre total pour la pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM form_data fd
      LEFT JOIN form f ON fd.form_id = f.form_id
      WHERE 1=1
    `;

    let countParams = [];
    let countParamCount = 0;

    // Appliquer les mêmes filtres pour le comptage
    if (form_id) {
      countParamCount++;
      countQuery += ` AND fd.form_id = $${countParamCount}`;
      countParams.push(form_id);
    }

    if (dash_id) {
      countParamCount++;
      countQuery += ` AND f.dash_id = $${countParamCount}`;
      countParams.push(parseInt(dash_id));
    }

    if (start_date) {
      countParamCount++;
      countQuery += ` AND fd.created_at >= $${countParamCount}`;
      countParams.push(start_date);
    }

    if (end_date) {
      countParamCount++;
      countQuery += ` AND fd.created_at <= $${countParamCount}`;
      countParams.push(end_date);
    }

    const totalResult = await db.one(countQuery, countParams);

    // Réponse avec pagination et métadonnées
    const response = {
      success: true,
      data: consolidatedData,
      meta: {
        total: parseInt(totalResult.total),
        count: consolidatedData.length,
        page: offset ? Math.floor(offset / (limit || 20)) + 1 : 1,
        per_page: limit ? parseInt(limit) : consolidatedData.length,
        has_more: totalResult.total > (parseInt(offset || 0) + consolidatedData.length)
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération des soumissions:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données',
      message: error.message
    });
  }
};

// Fonction alternative plus simple pour récupérer toutes les données brutes
export const getAllSubmissionsRaw = async (req, res) => {
  try {
    const { form_id, dash_id } = req.query;

    let query = `
      SELECT json_agg(
        json_build_object(
          'id', fd.id,
          'form_id', fd.form_id,
          'odk_instance_id', fd.odk_instance_id,
          'created_at', fd.created_at,
          'data', fd.data
        )
      ) as submissions
      FROM form_data fd
      LEFT JOIN form f ON fd.form_id = f.form_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (form_id) {
      paramCount++;
      query += ` AND fd.form_id = $${paramCount}`;
      params.push(form_id);
    }

    if (dash_id) {
      paramCount++;
      query += ` AND f.dash_id = $${paramCount}`;
      params.push(parseInt(dash_id));
    }

    const result = await db.one(query, params);

    // Consolider toutes les données dans un seul tableau plat
    const consolidatedData = [];
    
    if (result.submissions) {
      result.submissions.forEach(submission => {
        // Mélanger les données JSON avec les métadonnées
        consolidatedData.push({
          _id: submission.id,
          _form_id: submission.form_id,
          _odk_instance_id: submission.odk_instance_id,
          _created_at: submission.created_at,
          ...submission.data
        });
      });
    }

    res.status(200).json({
      success: true,
      data: consolidatedData,
      total: consolidatedData.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des soumissions brutes:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données',
      message: error.message
    });
  }
};

// Fonction pour récupérer les données consolidées par dashboard
export const getSubmissionsByDashboard = async (req, res) => {
  try {
    const { dash_id } = req.params;
    
    if (!dash_id) {
      return res.status(400).json({
        success: false,
        error: 'dash_id est requis'
      });
    }

    const query = `
      SELECT 
        dr.name as dashboard_name,
        dr.province,
        json_agg(
          json_build_object(
            'form_id', f.form_id,
            'form_name', f.name,
            'submissions', (
              SELECT json_agg(
                json_build_object(
                  'id', fd.id,
                  'odk_instance_id', fd.odk_instance_id,
                  'created_at', fd.created_at,
                  'data', fd.data
                )
              )
              FROM form_data fd 
              WHERE fd.form_id = f.form_id
            )
          )
        ) as forms_data
      FROM dashboard_recrutement dr
      LEFT JOIN form f ON dr.id = f.dash_id
      WHERE dr.id = $1 AND f.pause = false
      GROUP BY dr.id, dr.name, dr.province
    `;

    const result = await db.oneOrNone(query, [parseInt(dash_id)]);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard non trouvé'
      });
    }

    // Consolider toutes les soumissions de tous les formulaires du dashboard
    const allSubmissions = [];
    
    if (result.forms_data) {
      result.forms_data.forEach(form => {
        if (form.submissions) {
          form.submissions.forEach(submission => {
            allSubmissions.push({
              _dashboard_name: result.dashboard_name,
              _province: result.province,
              _form_id: form.form_id,
              _form_name: form.form_name,
              _id: submission.id,
              _odk_instance_id: submission.odk_instance_id,
              _created_at: submission.created_at,
              ...submission.data
            });
          });
        }
      });
    }

    res.status(200).json({
      success: true,
      dashboard: {
        id: parseInt(dash_id),
        name: result.dashboard_name,
        province: result.province
      },
      data: allSubmissions,
      total: allSubmissions.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des soumissions par dashboard:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données',
      message: error.message
    });
  }
};

export const getCandidates = async (req, res, next) => {
  try {
    const { dash_id } = req.params;
    if (!dash_id) {
      return res.status(400).json({ error: 'The identifiant dashboard is required is required' });
    }
    const rows = await db.any(`
      SELECT * FROM candidate
      WHERE form_data_id IN (
        SELECT id FROM form_data WHERE form_id IN (
          SELECT form_id FROM form WHERE dash_id = $1
        )
      )
      ORDER BY total_score DESC;
    `, [dash_id]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const getFormStatsDetail = async (req, res, next) => {
  try {
    const { dash_id } = req.query;
    if (!dash_id) {
      return res.status(400).json({ error: 'The identifiant dashboard is required is required' });
    }
    const sql = `SELECT * FROM form_stats_detail WHERE dash_id = $1 ORDER BY periode DESC, id ASC`;
    const rows = await db.any(sql, [dash_id]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
}; 