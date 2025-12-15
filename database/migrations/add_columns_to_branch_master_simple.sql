-- Simple Migration: Add columns to branch_master table
-- Date: 2024-12-25
-- Description: Updates branch_master table to support the new IP layout hierarchy
-- 
-- IMPORTANT: Run this script in your MySQL database
-- If you get errors about columns already existing, that's fine - they've already been added

-- Add cityId column
ALTER TABLE branch_master 
ADD COLUMN cityId INT NULL 
AFTER name;

-- Modify branchCode to allow NULL and increase length to 10
ALTER TABLE branch_master 
MODIFY COLUMN branchCode VARCHAR(10) NULL;

-- Add address column
ALTER TABLE branch_master 
ADD COLUMN address TEXT NULL 
AFTER branchCode;

-- Add isActive column
ALTER TABLE branch_master 
ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT TRUE 
AFTER address;

-- Add createdBy column
ALTER TABLE branch_master 
ADD COLUMN createdBy INT NULL 
AFTER isActive;

-- Add updatedBy column
ALTER TABLE branch_master 
ADD COLUMN updatedBy INT NULL 
AFTER createdBy;

-- Update existing records to have isActive = true
UPDATE branch_master 
SET isActive = TRUE 
WHERE isActive IS NULL;

-- Optional: Add foreign key constraint for cityId
-- Uncomment the line below if you want to enforce referential integrity
-- Note: This will fail if there are existing branches with invalid cityId values
-- ALTER TABLE branch_master ADD CONSTRAINT fk_branch_city FOREIGN KEY (cityId) REFERENCES city_master(id);

