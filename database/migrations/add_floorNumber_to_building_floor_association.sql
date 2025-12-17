-- Migration: Add missing columns to building_floor_association table
-- Date: 2024-12-25
-- Description: Adds floorNumber, floorType, and createdBy columns to building_floor_association
-- 
-- IMPORTANT: Run this script in your MySQL database
-- If you get errors about columns already existing, that's fine - they've already been added

-- Add floorNumber column (optional, allows NULL)
ALTER TABLE building_floor_association
ADD COLUMN floorNumber INT NULL
AFTER name;

-- Add floorType column (ENUM: IP, ICU, Mixed)
ALTER TABLE building_floor_association
ADD COLUMN floorType ENUM('IP', 'ICU', 'Mixed') NULL DEFAULT 'IP'
AFTER floorNumber;

-- Add createdBy column (nullable initially, can be updated later)
ALTER TABLE building_floor_association
ADD COLUMN createdBy INT NULL
AFTER isActive;

-- Add index for better query performance when filtering by floorNumber
CREATE INDEX idx_floor_number ON building_floor_association(buildingId, floorNumber);

-- Update existing records to have default floorType if NULL
UPDATE building_floor_association
SET floorType = 'IP'
WHERE floorType IS NULL;

