-- =====================================================
-- CREATE PAYMENTS TABLE FOR PAYMENT MANAGEMENT
-- =====================================================
-- This migration creates the payments table for storing payment records
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branchId INT NOT NULL COMMENT 'Foreign key to branch_master',
    paymentDate DATE NOT NULL COMMENT 'Date of payment',
    departmentId INT NOT NULL COMMENT 'Foreign key to department_master',
    vendorId INT NOT NULL COMMENT 'Foreign key to vendor_master',
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Payment amount',
    invoiceUrl TEXT NULL COMMENT 'S3 URL for uploaded invoice file',
    receiptUrl TEXT NULL COMMENT 'S3 URL for uploaded payment receipt file',
    createdBy INT NOT NULL COMMENT 'User ID who created the payment',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branchId) REFERENCES branch_master(id) ON DELETE RESTRICT,
    FOREIGN KEY (departmentId) REFERENCES department_master(id) ON DELETE RESTRICT,
    -- Note: vendorId references stockmanagement.vendor_master which is in a different database
    -- Foreign key constraint cannot be created across databases
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_branchId (branchId),
    INDEX idx_paymentDate (paymentDate),
    INDEX idx_departmentId (departmentId),
    INDEX idx_vendorId (vendorId),
    INDEX idx_createdAt (createdAt)
) COMMENT 'Table to store payment records with invoice and receipt files';

