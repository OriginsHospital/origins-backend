-- Migration: Add missing columns to room_bed_association table
-- Date: 2024-12-25
-- Description: Adds bedNumber and other missing columns to room_bed_association
-- 
-- IMPORTANT: Run this script in your MySQL database
-- If you get errors about columns already existing, that's fine - they've already been added

-- Add bedNumber column (optional, allows NULL)
ALTER TABLE room_bed_association
ADD COLUMN bedNumber VARCHAR(50) NULL
AFTER name;

-- Add bedType column (ENUM: Normal, ICU)
ALTER TABLE room_bed_association
ADD COLUMN bedType ENUM('Normal', 'ICU') NULL DEFAULT 'Normal'
AFTER bedNumber;

-- Add hasOxygen column
ALTER TABLE room_bed_association
ADD COLUMN hasOxygen BOOLEAN NULL DEFAULT FALSE
AFTER bedType;

-- Add hasVentilator column
ALTER TABLE room_bed_association
ADD COLUMN hasVentilator BOOLEAN NULL DEFAULT FALSE
AFTER hasOxygen;

-- Add charge column
ALTER TABLE room_bed_association
ADD COLUMN charge DECIMAL(10, 2) NULL DEFAULT 0
AFTER hasVentilator;

-- Add status column (ENUM: Available, Occupied, Reserved, Maintenance)
ALTER TABLE room_bed_association
ADD COLUMN status ENUM('Available', 'Occupied', 'Reserved', 'Maintenance') NULL DEFAULT 'Available'
AFTER charge;

-- Add isBooked column
ALTER TABLE room_bed_association
ADD COLUMN isBooked BOOLEAN NULL DEFAULT FALSE
AFTER status;

-- Add isActive column if it doesn't exist
ALTER TABLE room_bed_association
ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT TRUE
AFTER isBooked;

-- Add createdBy column (nullable initially to handle existing records)
ALTER TABLE room_bed_association
ADD COLUMN createdBy INT NULL
AFTER isActive;

-- Add index for better query performance when filtering by bedNumber
CREATE INDEX idx_bed_number ON room_bed_association(roomId, bedNumber);

-- Update existing records to have default values if NULL
UPDATE room_bed_association
SET bedType = 'Normal'
WHERE bedType IS NULL;

UPDATE room_bed_association
SET hasOxygen = FALSE
WHERE hasOxygen IS NULL;

UPDATE room_bed_association
SET hasVentilator = FALSE
WHERE hasVentilator IS NULL;

UPDATE room_bed_association
SET charge = 0
WHERE charge IS NULL;

UPDATE room_bed_association
SET status = 'Available'
WHERE status IS NULL;

UPDATE room_bed_association
SET isBooked = FALSE
WHERE isBooked IS NULL;

UPDATE room_bed_association
SET isActive = TRUE
WHERE isActive IS NULL;

