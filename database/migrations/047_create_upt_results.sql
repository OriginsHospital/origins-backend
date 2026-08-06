-- =====================================================
-- CREATE UPT RESULTS TABLE
-- =====================================================
-- Stores urine pregnancy test (UPT) result entries
-- =====================================================

CREATE TABLE IF NOT EXISTS upt_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    testDate DATE NOT NULL COMMENT 'Date of UPT test',
    branchId INT NOT NULL COMMENT 'FK to branch_master.id',
    patientId INT NOT NULL COMMENT 'FK to patient_master.id',
    cycleType ENUM('IVF', 'OI-TI', 'IUI') NOT NULL COMMENT 'Treatment / cycle type',
    uptResult ENUM('Positive', 'Negative') NOT NULL COMMENT 'UPT result',
    createdByNurseId INT NOT NULL COMMENT 'FK to ot_person_master.id (staff nurse)',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_upt_test_date (testDate),
    INDEX idx_upt_branch_id (branchId),
    INDEX idx_upt_patient_id (patientId),
    INDEX idx_upt_cycle_type (cycleType),
    INDEX idx_upt_result (uptResult),
    INDEX idx_upt_created_by (createdByNurseId)
) COMMENT 'Urine pregnancy test (UPT) results';
