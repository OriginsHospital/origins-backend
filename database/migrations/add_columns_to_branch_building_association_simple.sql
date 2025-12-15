-- Simple Migration: Add columns to branch_building_association table
-- Date: 2024-12-25
-- Description: Updates branch_building_association table to support the new IP layout hierarchy
-- 
-- IMPORTANT: Run this script in your MySQL database
-- If you get errors about columns already existing, that's fine - they've already been added

-- Add buildingCode column - THIS FIXES THE ERROR!
ALTER TABLE branch_building_association 
ADD COLUMN buildingCode VARCHAR(20) NULL 
AFTER name;

-- Add totalFloors column
ALTER TABLE branch_building_association 
ADD COLUMN totalFloors INT NULL 
AFTER buildingCode;

-- Add isActive column
ALTER TABLE branch_building_association 
ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT TRUE 
AFTER totalFloors;

-- Add createdBy column
ALTER TABLE branch_building_association 
ADD COLUMN createdBy INT NOT NULL 
AFTER isActive;

-- Update existing records to have isActive = true
UPDATE branch_building_association 
SET isActive = TRUE 
WHERE isActive IS NULL;

