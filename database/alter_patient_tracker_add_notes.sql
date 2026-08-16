-- =============================================
-- Add free-text notes on patient_tracker
-- Used by Summary Automated Actions column
-- Run once after create_patient_tracker_table*.sql
-- =============================================

ALTER TABLE patient_tracker
  ADD COLUMN notes TEXT NULL COMMENT 'Free-text tracker notes' AFTER uptManualEntry;
