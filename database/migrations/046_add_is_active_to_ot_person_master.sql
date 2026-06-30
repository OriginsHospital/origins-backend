-- Add isActive column to ot_person_master for filtering active clinical professionals
SET @dbname = DATABASE();
SET @tablename = "ot_person_master";
SET @columnname = "isActive";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column isActive already exists on ot_person_master.'",
  CONCAT(
    "ALTER TABLE ",
    @tablename,
    " ADD COLUMN ",
    @columnname,
    " TINYINT(1) NOT NULL DEFAULT 1 AFTER designationId"
  )
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

UPDATE ot_person_master
SET isActive = 1
WHERE isActive IS NULL;
