-- =====================================================
-- CREATE REFERRING DOCTORS TABLES
-- =====================================================
-- Stores referring doctor details and audit log
-- =====================================================

CREATE TABLE IF NOT EXISTS referring_doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctorName VARCHAR(255) NOT NULL COMMENT 'Doctor name without Dr. prefix',
    specialization VARCHAR(100) NOT NULL,
    branchId INT NOT NULL,
    areaVillage VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(10) NOT NULL,
    hospitalName VARCHAR(255) NOT NULL,
    isActive TINYINT(1) NOT NULL DEFAULT 1,
    createdBy INT NULL,
    updatedBy INT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branchId) REFERENCES branch_master(id),
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updatedBy) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_specialization (specialization),
    INDEX idx_branch_id (branchId),
    INDEX idx_is_active (isActive),
    INDEX idx_doctor_name (doctorName),
    UNIQUE KEY idx_contact_number_unique (contactNumber)
) COMMENT 'Referring doctors who refer patients to the hospital';

CREATE TABLE IF NOT EXISTS referring_doctors_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referringDoctorId INT NOT NULL,
    doctorName VARCHAR(255) NOT NULL,
    action ENUM('Created', 'Updated', 'Activated', 'Deactivated') NOT NULL,
    previousValue TEXT NULL,
    updatedValue TEXT NULL,
    performedBy INT NOT NULL,
    performedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referringDoctorId) REFERENCES referring_doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (performedBy) REFERENCES users(id),
    INDEX idx_referring_doctor_id (referringDoctorId),
    INDEX idx_performed_at (performedAt)
) COMMENT 'Audit log for referring doctor records';
