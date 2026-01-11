-- =============================================
-- Patient Tracker Table Creation Script (Simplified)
-- =============================================
-- Description: Creates table to store patient tracker report data
-- This version is compatible with older MySQL versions (no generated columns)
-- Date: 2025-01-15
-- =============================================

-- Create patient_tracker table
CREATE TABLE IF NOT EXISTS patient_tracker (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Patient Basic Details
    date DATE NOT NULL COMMENT 'Tracker entry date',
    branchId INT NOT NULL COMMENT 'Branch ID reference',
    patientId VARCHAR(100) NOT NULL COMMENT 'Patient ID from patient_master',
    patientName VARCHAR(255) NOT NULL COMMENT 'Patient full name',
    mobileNumber VARCHAR(15) COMMENT 'Patient mobile number',
    referralSourceId INT COMMENT 'Referral source ID reference',
    referralName VARCHAR(255) COMMENT 'Referral name (if referral source is selected)',
    
    -- Treatment Details
    plan VARCHAR(255) COMMENT 'Treatment plan',
    treatmentType ENUM('IVF', 'OI-TI', 'IUI') NOT NULL COMMENT 'Type of treatment',
    cycleStatus ENUM('Not Started', 'Registered', 'Running', 'Complete', 'Cancelled') NOT NULL COMMENT 'Current cycle status',
    stageOfCycle VARCHAR(255) COMMENT 'Current stage of the cycle',
    
    -- Package Details
    packageName VARCHAR(255) COMMENT 'Package name',
    
    -- Financial Details
    packageAmount DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Total package amount',
    registrationAmount DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Registration amount paid',
    paidAmount DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Total amount paid',
    pendingAmount DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Pending amount (calculated as packageAmount - paidAmount)',
    
    -- Embryology Details
    numberOfEmbryos INT DEFAULT 0 COMMENT 'Total number of embryos',
    numberOfEmbryosUsed INT DEFAULT 0 COMMENT 'Number of embryos used',
    numberOfEmbryosDiscarded INT DEFAULT 0 COMMENT 'Number of embryos discarded',
    lastRenewalDate DATE COMMENT 'Last renewal date for embryos',
    embryosRemaining INT DEFAULT 0 COMMENT 'Embryos remaining (calculated as numberOfEmbryos - numberOfEmbryosUsed)',
    
    -- UPT Result
    uptResult ENUM('Positive', 'Negative', 'Others') COMMENT 'UPT test result',
    uptManualEntry VARCHAR(255) COMMENT 'Manual entry for UPT result when "Others" is selected',
    
    -- Audit Fields
    createdBy INT COMMENT 'User ID who created this record',
    updatedBy INT COMMENT 'User ID who last updated this record',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record last update timestamp',
    
    -- Foreign Key Constraints
    FOREIGN KEY (branchId) REFERENCES branch_master(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (referralSourceId) REFERENCES referral_type_master(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updatedBy) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Indexes for better query performance
    INDEX idx_date (date),
    INDEX idx_branchId (branchId),
    INDEX idx_patientId (patientId),
    INDEX idx_date_branch (date, branchId),
    INDEX idx_treatment_type (treatmentType),
    INDEX idx_cycle_status (cycleStatus),
    INDEX idx_created_at (createdAt)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Table to store patient tracker report data';

