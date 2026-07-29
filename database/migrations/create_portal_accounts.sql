-- Patient portal + super-admin accounts (does not alter existing HMS users flow)
CREATE TABLE IF NOT EXISTS portal_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  accountType ENUM('super_admin', 'patient') NOT NULL,
  patientMasterId INT NULL,
  patientCode VARCHAR(100) NULL,
  fullName VARCHAR(150) NOT NULL,
  mobileNo VARCHAR(20) NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdBy INT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_portal_email (email),
  UNIQUE KEY uniq_portal_patient (patientMasterId),
  KEY idx_portal_account_type (accountType),
  KEY idx_portal_patient_code (patientCode)
);
