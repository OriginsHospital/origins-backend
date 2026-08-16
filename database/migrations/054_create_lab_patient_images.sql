-- =====================================================
-- CREATE LAB PATIENT IMAGES TABLE
-- =====================================================
-- Stores ECG and NST images uploaded from Lab In-House.
-- NST is allowed only for antenatal visit types.
-- =====================================================

CREATE TABLE IF NOT EXISTS lab_patient_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointmentId INT NOT NULL COMMENT 'Consultation or treatment appointment id',
    type VARCHAR(50) NOT NULL COMMENT 'CONSULTATION or TREATMENT',
    imageType ENUM('ECG', 'NST') NOT NULL COMMENT 'Uploaded image category',
    imageUrl TEXT NOT NULL,
    imageKey TEXT NOT NULL,
    uploadedBy INT NULL COMMENT 'Logged-in user who uploaded the image',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lab_patient_images_appointment (appointmentId, type, imageType)
) COMMENT 'ECG and NST images uploaded from Lab In-House';
