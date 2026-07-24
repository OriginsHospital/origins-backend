-- =============================================
-- Extend patient_tracker with clinical date fields
-- used on Summary Automated (ICSI-D1, OPU, FET-D1, FET)
-- Run once after create_patient_tracker_table*.sql
-- =============================================

ALTER TABLE patient_tracker
  ADD COLUMN icsiD1 DATE NULL COMMENT 'ICSI Day 1 date' AFTER pendingAmount,
  ADD COLUMN opu DATE NULL COMMENT 'OPU date' AFTER icsiD1,
  ADD COLUMN fetD1 DATE NULL COMMENT 'FET Day 1 date' AFTER opu,
  ADD COLUMN fet DATE NULL COMMENT 'FET date' AFTER fetD1;
