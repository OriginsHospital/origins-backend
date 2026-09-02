-- Multiple FET cycles per treatment: keep every cycle's dates and sheet.
-- Existing FET rows are treated as cycle 1.

CREATE TABLE IF NOT EXISTS treatment_fet_cycles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitId INT NOT NULL,
    treatmentCycleId INT NOT NULL,
    cycleNumber INT NOT NULL,
    fetStartDate DATETIME NULL,
    fetStartedBy INT NULL,
    fetEndedDate DATETIME NULL,
    fetEndedReason TEXT NULL,
    fetEndedBy INT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_fet_cycle (treatmentCycleId, cycleNumber),
    INDEX idx_fet_cycles_visit (visitId)
) COMMENT 'Historical FET cycle start/end records for a treatment';

SET @dbname = DATABASE();
SET @tablename = "treatment_fetsheet_associations";
SET @columnname = "cycleNumber";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column cycleNumber already exists on treatment_fetsheet_associations.'",
  "ALTER TABLE treatment_fetsheet_associations ADD COLUMN cycleNumber INT NOT NULL DEFAULT 1 AFTER treatmentCycleId"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
