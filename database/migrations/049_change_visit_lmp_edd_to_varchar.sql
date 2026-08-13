-- Store LMP and EDD as free-text values instead of dates.

ALTER TABLE patient_visits_association
  MODIFY COLUMN lmp VARCHAR(100) NULL DEFAULT NULL,
  MODIFY COLUMN edd VARCHAR(100) NULL DEFAULT NULL;
