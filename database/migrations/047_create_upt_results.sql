-- =====================================================
-- CREATE UPT RESULTS TABLE
-- =====================================================
-- Stores urine pregnancy test (UPT) result entries
-- =====================================================

CREATE TABLE IF NOT EXISTS upt_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resultDate DATE NOT NULL COMMENT 'Date of UPT result',
    branchId INT NOT NULL COMMENT 'FK to branch_master.id',
    patientId INT NOT NULL COMMENT 'FK to patient_master.id',
    cycleType VARCHAR(150) NOT NULL COMMENT 'Treatment / cycle type name',
    uptResult ENUM('Positive', 'Negative') NOT NULL COMMENT 'UPT outcome',
    createdByNurseId INT NOT NULL COMMENT 'FK to ot_person_master.id (staff nurse)',
    createdBy INT NULL COMMENT 'Logged-in user who saved the record',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_upt_result_date (resultDate),
    INDEX idx_upt_branch_id (branchId),
    INDEX idx_upt_patient_id (patientId),
    INDEX idx_upt_cycle_type (cycleType),
    INDEX idx_upt_result (uptResult),
    INDEX idx_upt_created_by_nurse (createdByNurseId)
) COMMENT 'Urine pregnancy test (UPT) result data entry records';
