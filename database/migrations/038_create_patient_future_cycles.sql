-- =====================================================
-- CREATE PATIENT FUTURE CYCLES TABLE
-- =====================================================
-- Stores patients scheduled for future treatment cycles
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_future_cycles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patientId INT NOT NULL COMMENT 'FK to patient_master.id',
    cycleMonth TINYINT NOT NULL COMMENT 'Scheduled cycle month (1-12)',
    cycleYear SMALLINT NOT NULL COMMENT 'Scheduled cycle year',
    createdBy INT NULL COMMENT 'User who created the record',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES patient_master(id) ON DELETE CASCADE,
    UNIQUE KEY unique_patient_future_cycle (patientId),
    INDEX idx_cycle_year_month (cycleYear, cycleMonth),
    INDEX idx_patient_id (patientId)
) COMMENT 'Patients scheduled for future treatment cycles';
