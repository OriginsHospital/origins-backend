-- Speed up Pharmacy → Medicine Stages list (getPharmacyDetailsByDate)
-- Safe to run multiple times: skips indexes that already exist.

-- Consultation appointments filtered by date + branch
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'consultation_appointments_associations'
    AND index_name = 'idx_caa_appt_date_branch'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_caa_appt_date_branch ON consultation_appointments_associations (appointmentDate, branchId)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Treatment appointments filtered by date + branch
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'treatment_appointments_associations'
    AND index_name = 'idx_taa_appt_date_branch'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_taa_appt_date_branch ON treatment_appointments_associations (appointmentDate, branchId)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Pharmacy line bills (billTypeId = 3)
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'consultation_appointment_line_bills_associations'
    AND index_name = 'idx_calba_appt_billtype'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_calba_appt_billtype ON consultation_appointment_line_bills_associations (appointmentId, billTypeId)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'treatment_appointment_line_bills_associations'
    AND index_name = 'idx_talba_appt_billtype'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_talba_appt_billtype ON treatment_appointment_line_bills_associations (appointmentId, billTypeId)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Paid pharmacy orders lookup
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'order_details_master'
    AND index_name = 'idx_odm_pharmacy_paid'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_odm_pharmacy_paid ON order_details_master (productType, paymentStatus, type, id)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
