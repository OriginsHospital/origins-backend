ALTER TABLE consultation_doctor_master
ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1 AFTER shiftTo;

UPDATE consultation_doctor_master
SET isActive = 1
WHERE isActive IS NULL;
