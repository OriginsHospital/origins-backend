-- Migration for MySQL (without IF NOT EXISTS support)
-- Date: 2024-12-25
-- 
-- Run this script in MySQL to fix "Unknown column 'createdBy'" error
-- If you get "Duplicate column name" errors, those columns already exist - that's fine!

-- Step 1: Add cityId column
ALTER TABLE branch_master 
ADD COLUMN cityId INT NULL 
AFTER name;

-- Step 2: Modify branchCode to allow NULL and increase length to 10
ALTER TABLE branch_master 
MODIFY COLUMN branchCode VARCHAR(10) NULL;

-- Step 3: Add address column
ALTER TABLE branch_master 
ADD COLUMN address TEXT NULL 
AFTER branchCode;

-- Step 4: Add isActive column
ALTER TABLE branch_master 
ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT TRUE 
AFTER address;

-- Step 5: Add createdBy column - THIS FIXES THE ERROR!
ALTER TABLE branch_master 
ADD COLUMN createdBy INT NULL 
AFTER isActive;

-- Step 6: Add updatedBy column
ALTER TABLE branch_master 
ADD COLUMN updatedBy INT NULL 
AFTER createdBy;

-- Step 7: Update existing records
UPDATE branch_master 
SET isActive = TRUE 
WHERE isActive IS NULL;

