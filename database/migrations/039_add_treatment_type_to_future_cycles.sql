-- =====================================================
-- ADD treatmentTypeId TO patient_future_cycles
-- =====================================================

ALTER TABLE patient_future_cycles
  ADD COLUMN treatmentTypeId INT NULL
    COMMENT 'Optional planned/override treatment type'
    AFTER cycleYear;

ALTER TABLE patient_future_cycles
  ADD INDEX idx_treatment_type_id (treatmentTypeId);
