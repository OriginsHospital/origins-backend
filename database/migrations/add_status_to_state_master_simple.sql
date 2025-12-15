-- Simple Migration: Add status and createdBy columns to state_master table
-- Date: 2024-12-25
-- Description: Updates state_master table to use status ENUM instead of isActive boolean
-- 
-- IMPORTANT: Run this script in your MySQL database
-- If you get errors about columns already existing, that's fine - they've already been added

-- Add status column with ENUM type
ALTER TABLE state_master 
ADD COLUMN status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' 
AFTER name;

-- Add createdBy column
ALTER TABLE state_master 
ADD COLUMN createdBy INT NULL 
AFTER status;

-- Add updatedBy column
ALTER TABLE state_master 
ADD COLUMN updatedBy INT NULL 
AFTER createdBy;

-- Update existing records to have 'Active' status
UPDATE state_master 
SET status = 'Active' 
WHERE status IS NULL OR status = '';

-- Optional: Add unique constraint on name column
-- Uncomment the line below if you want unique state names
-- Note: This will fail if duplicate names exist - handle duplicates first
-- ALTER TABLE state_master ADD UNIQUE KEY unique_name (name);

