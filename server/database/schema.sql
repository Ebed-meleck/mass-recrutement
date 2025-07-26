-- SCHEMA 
-- ==============================================

-- TABLE: dashboard_recrutement
DROP TABLE IF EXISTS dashboard_recrutement CASCADE;
CREATE TABLE dashboard_recrutement (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  province   VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
); 

-- TABLE: form
DROP TABLE IF EXISTS form CASCADE;
CREATE TABLE form (
  id          SERIAL PRIMARY KEY,
  form_id     VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  project_id  INTEGER NOT NULL,
  pause       BOOLEAN NOT NULL DEFAULT FALSE,
  type_form   VARCHAR(255) NOT NULL,
  dash_id     INTEGER REFERENCES dashboard_recrutement(id) ON DELETE SET NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_submission_date TIMESTAMP
);

-- TABLE: form_data 
DROP TABLE IF EXISTS form_data CASCADE;
CREATE TABLE form_data (
  id            SERIAL PRIMARY KEY,
  form_id       VARCHAR(255) REFERENCES form(form_id) ON DELETE CASCADE,
  data          JSONB NOT NULL,
  odk_instance_id VARCHAR(255),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contraintes et index pour form_data
DROP INDEX IF EXISTS idx_form_data_unique_submission;
CREATE UNIQUE INDEX idx_form_data_unique_submission 
ON form_data(form_id, odk_instance_id) 
WHERE odk_instance_id IS NOT NULL;

-- Index pour les performances
DROP INDEX IF EXISTS idx_form_data_form_id;
DROP INDEX IF EXISTS idx_form_data_created_at;
DROP INDEX IF EXISTS idx_form_data_odk_instance;
CREATE INDEX idx_form_data_form_id ON form_data(form_id);
CREATE INDEX idx_form_data_created_at ON form_data(created_at);
CREATE INDEX idx_form_data_odk_instance ON form_data(odk_instance_id);

-- TABLE: candidate 
DROP TABLE IF EXISTS candidate CASCADE;
CREATE TABLE candidate (
  id                   SERIAL PRIMARY KEY,
  form_data_id         INTEGER REFERENCES form_data(id) ON DELETE CASCADE,
  nom                  VARCHAR(255),
  post_nom             VARCHAR(255),
  prenom               VARCHAR(255),
  sexe                 VARCHAR(50),
  date_naissance       VARCHAR(50),
  telephone            VARCHAR(50),
  email                VARCHAR(255),
  province_origine     VARCHAR(255),
  nationalite          VARCHAR(255),
  niveau_etudes        VARCHAR(255),
  adresse_physique     VARCHAR(255),
  experience_ima       VARCHAR(255),
  zone_provenance      VARCHAR(255),
  total_score          NUMERIC,
  pourcentage          NUMERIC,
  UNIQUE(form_data_id)
);

-- TABLE: form_stats (
DROP TABLE IF EXISTS form_stats CASCADE;
CREATE TABLE form_stats (
  id                  SERIAL PRIMARY KEY,
  form_id             VARCHAR(255) REFERENCES form(form_id) ON DELETE CASCADE, -- Nullable maintenant
  dash_id             INTEGER REFERENCES dashboard_recrutement(id) ON DELETE CASCADE,
  periode             VARCHAR(50),
  nb_candidats        INTEGER DEFAULT 0,
  nb_admis            INTEGER DEFAULT 0,
  nb_refuses          INTEGER DEFAULT 0,
  taux_reussite       NUMERIC DEFAULT 0,
  score_moyen         NUMERIC DEFAULT 0,
  score_median        NUMERIC DEFAULT 0,
  score_min           NUMERIC DEFAULT 0,
  score_max           NUMERIC DEFAULT 0,
  pourcentage_moyen   NUMERIC DEFAULT 0,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(dash_id, periode)
);


-- TABLE: setting 
DROP TABLE IF EXISTS setting CASCADE;
CREATE TABLE setting (
  id     SERIAL PRIMARY KEY,
  seuil  NUMERIC NOT NULL
);


-- TABLE: form_stats_detail 
DROP TABLE IF EXISTS form_stats_detail CASCADE;
CREATE TABLE form_stats_detail (
  id              SERIAL PRIMARY KEY,
  form_id         VARCHAR(255) REFERENCES form(form_id) ON DELETE CASCADE,
  dash_id         INTEGER REFERENCES dashboard_recrutement(id) ON DELETE CASCADE,
  periode         VARCHAR(50),
  sexe            VARCHAR(50), 
  statut          VARCHAR(20), 
  tranche_score   VARCHAR(50), 
  nb_candidats    INTEGER DEFAULT 0,
  pourcentage     NUMERIC DEFAULT 0, 
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(form_id, dash_id, periode, sexe, statut, tranche_score)
);

-- Index pour form_stats_detail
DROP INDEX IF EXISTS idx_form_stats_detail_dash_id;
DROP INDEX IF EXISTS idx_form_stats_detail_periode;
DROP INDEX IF EXISTS idx_form_stats_detail_dash_periode;
CREATE INDEX idx_form_stats_detail_dash_id ON form_stats_detail(dash_id);
CREATE INDEX idx_form_stats_detail_periode ON form_stats_detail(periode);
CREATE INDEX idx_form_stats_detail_dash_periode ON form_stats_detail(dash_id, periode);