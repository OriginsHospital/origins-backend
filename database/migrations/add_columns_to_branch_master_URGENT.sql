-- URGENT: Run this script immediately to fix "Unknown column 'createdBy'" error
-- Date: 2024-12-25
-- 
-- Copy and paste this entire script into your MySQL client and run it

-- Add cityId column (if it doesn't exist)
ALTER TABLE branch_master 
ADD COLUMN IF NOT EXISTS cityId INT NULL 
AFTER name;

-- Modify branchCode to allow NULL and increase length to 10
ALTER TABLE branch_master 
MODIFY COLUMN branchCode VARCHAR(10) NULL;

-- Add address column (if it doesn't exist)
ALTER TABLE branch_master 
ADD COLUMN IF NOT EXISTS address TEXT NULL 
AFTER branchCode;

-- Add isActive column (if it doesn't exist)
ALTER TABLE branch_master 
ADD COLUMN IF NOT EXISTS isActive BOOLEAN NOT NULL DEFAULT TRUE 
AFTER address;

-- Add createdBy column (if it doesn't exist) - THIS FIXES THE ERROR
ALTER TABLE branch_master 
ADD COLUMN IF NOT EXISTS createdBy INT NULL 
AFTER isActive;

-- Add updatedBy column (if it doesn't exist)
ALTER TABLE branch_master 
ADD COLUMN IF NOT EXISTS updatedBy INT NULL 
AFTER createdBy;

-- Update existing records to have isActive = true
UPDATE branch_master 
SET isActive = TRUE 
WHERE isActive IS NULL;

