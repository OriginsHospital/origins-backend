-- Migration: Add missing columns to floor_room_association table
-- Date: 2024-12-25
-- Description: Adds roomNumber and other missing columns to floor_room_association
-- 
-- IMPORTANT: Run this script in your MySQL database
-- If you get errors about columns already existing, that's fine - they've already been added

-- Add roomNumber column (optional, allows NULL)
ALTER TABLE floor_room_association
ADD COLUMN roomNumber VARCHAR(50) NULL
AFTER name;

-- Add roomCategory column (ENUM: General, Semi-Private, Private, VIP)
ALTER TABLE floor_room_association
ADD COLUMN roomCategory ENUM('General', 'Semi-Private', 'Private', 'VIP') NULL DEFAULT 'General'
AFTER type;

-- Add genderRestriction column (ENUM: Male, Female, Any)
ALTER TABLE floor_room_association
ADD COLUMN genderRestriction ENUM('Male', 'Female', 'Any') NULL DEFAULT 'Any'
AFTER roomCategory;

-- Add totalBeds column
ALTER TABLE floor_room_association
ADD COLUMN totalBeds INT NULL DEFAULT 0
AFTER genderRestriction;

-- Add charges column
ALTER TABLE floor_room_association
ADD COLUMN charges DECIMAL(10, 2) NULL DEFAULT 0
AFTER totalBeds;

-- Add isActive column if it doesn't exist
ALTER TABLE floor_room_association
ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT TRUE
AFTER charges;

-- Add createdBy column (nullable initially to handle existing records)
ALTER TABLE floor_room_association
ADD COLUMN createdBy INT NULL
AFTER isActive;

-- Add index for better query performance when filtering by roomNumber
CREATE INDEX idx_room_number ON floor_room_association(floorId, roomNumber);

-- Update existing records to have default values if NULL
UPDATE floor_room_association
SET roomCategory = 'General'
WHERE roomCategory IS NULL;

UPDATE floor_room_association
SET genderRestriction = 'Any'
WHERE genderRestriction IS NULL;

UPDATE floor_room_association
SET totalBeds = 0
WHERE totalBeds IS NULL;

UPDATE floor_room_association
SET charges = 0
WHERE charges IS NULL;

UPDATE floor_room_association
SET isActive = TRUE
WHERE isActive IS NULL;

