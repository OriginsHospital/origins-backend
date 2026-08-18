-- =====================================================
-- CREATE PATIENT DISCHARGE CARDS TABLE
-- =====================================================
-- Stores ORIGINS HOSPITAL discharge card data entered by
-- doctors. One card per antenatal visit so Scan and Doctor
-- screens share the same saved values.
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_discharge_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitId INT NOT NULL COMMENT 'FK to patient_visits_association.id',
    patientId INT NOT NULL COMMENT 'FK to patient_master.id',
    appointmentId INT NULL COMMENT 'Last appointment used to save the card',
    appointmentType VARCHAR(50) NULL COMMENT 'Consultation or Treatment',
    treatmentCycleId INT NULL COMMENT 'Optional treatment cycle id',
    cardData JSON NOT NULL COMMENT 'Discharge card form fields',
    createdBy INT NULL COMMENT 'Logged-in user who created the record',
    updatedBy INT NULL COMMENT 'Logged-in user who last updated the record',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_patient_discharge_cards_visit (visitId),
    INDEX idx_patient_discharge_cards_patient (patientId),
    INDEX idx_patient_discharge_cards_appointment (appointmentId, appointmentType)
) COMMENT 'Antenatal discharge card data shared across Doctor and Scan modules';
