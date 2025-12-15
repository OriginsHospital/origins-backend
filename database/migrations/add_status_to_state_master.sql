-- Migration: Add status and createdBy columns to state_master table
-- Date: 2024-12-25
-- Description: Updates state_master table to use status ENUM instead of isActive boolean

-- Step 1: Add status column with ENUM type (if it doesn't exist)
SET @dbname = DATABASE();
SET @tablename = "state_master";
SET @columnname = "status";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' AFTER name")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 2: Add createdBy column (if it doesn't exist)
SET @columnname = "createdBy";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INT NULL AFTER status")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 3: Add updatedBy column (if it doesn't exist)
SET @columnname = "updatedBy";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INT NULL AFTER createdBy")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 4: Update existing records to have 'Active' status (if any exist)
UPDATE state_master 
SET status = 'Active' 
WHERE status IS NULL OR status = '';

-- Step 5: Add unique constraint on name column (if it doesn't exist and no duplicates)
-- Note: Check for duplicates first: SELECT name, COUNT(*) FROM state_master GROUP BY name HAVING COUNT(*) > 1;
-- If duplicates exist, remove them before running this:
-- ALTER TABLE state_master ADD UNIQUE KEY unique_name (name);

