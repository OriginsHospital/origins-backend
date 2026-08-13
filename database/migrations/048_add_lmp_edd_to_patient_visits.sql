-- Add visit-level LMP and EDD for antenatal patients.
-- Entered on the first appointment and reused until the visit is closed.

SET @dbname = DATABASE();
SET @tablename = "patient_visits_association";

SET @columnname = "lmp";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column lmp already exists on patient_visits_association.'",
  CONCAT(
    "ALTER TABLE ",
    @tablename,
    " ADD COLUMN ",
    @columnname,
    " DATE NULL DEFAULT NULL"
  )
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "edd";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column edd already exists on patient_visits_association.'",
  CONCAT(
    "ALTER TABLE ",
    @tablename,
    " ADD COLUMN ",
    @columnname,
    " DATE NULL DEFAULT NULL AFTER lmp"
  )
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
