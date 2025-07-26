INSERT INTO "setting" (seuil) VALUES (60);



INSERT INTO "dashboard_recrutement" ("name", province) VALUES ('Tableau de bord de recrutement SI', 'Equateur');

INSERT INTO "form" ("form_id", "name", "project_id", "type_form", "dash_id") VALUES
('fm_gc7_eq_form_test_sup_independant_serie_1', 'Test superviseur independant equateur serie 1', 3, 'TEST SI', 1),
('fm_gc7_eq_form_test_sup_independant_serie_2', 'Test superviseur independant equateur serie 3', 3, 'TEST SI', 1),
('fm_gc7_eq_form_test_sup_independant_serie_3', 'Test superviseur independant equateur serie 2', 3, 'TEST SI', 1)
ON CONFLICT (form_id) DO NOTHING;

ALTER TABLE form_data 
ADD CONSTRAINT unique_form_data_submission 
UNIQUE (form_id, odk_instance_id);