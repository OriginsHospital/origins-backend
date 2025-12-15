-- Migration: Add cityId, address, isActive, createdBy, updatedBy columns to branch_master table
-- Date: 2024-12-25
-- Description: Updates branch_master table to support the new IP layout hierarchy

-- Step 1: Add cityId column (if it doesn't exist)
SET @dbname = DATABASE();
SET @tablename = "branch_master";
SET @columnname = "cityId";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INT NULL AFTER name")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 2: Modify branchCode to allow NULL and increase length to 10 (if needed)
-- First check current column definition
-- ALTER TABLE branch_master MODIFY COLUMN branchCode VARCHAR(10) NULL;

-- Step 3: Add address column (if it doesn't exist)
SET @columnname = "address";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " TEXT NULL AFTER branchCode")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 4: Add isActive column (if it doesn't exist)
SET @columnname = "isActive";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " BOOLEAN NOT NULL DEFAULT TRUE AFTER address")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 5: Add createdBy column (if it doesn't exist)
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
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INT NULL AFTER isActive")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 6: Add updatedBy column (if it doesn't exist)
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

-- Step 7: Add foreign key constraint for cityId (if it doesn't exist)
-- Note: This will fail if there are existing branches with invalid cityId values
-- ALTER TABLE branch_master ADD CONSTRAINT fk_branch_city FOREIGN KEY (cityId) REFERENCES city_master(id);

-- Step 8: Update existing records to have isActive = true (if any exist)
UPDATE branch_master 
SET isActive = TRUE 
WHERE isActive IS NULL;

