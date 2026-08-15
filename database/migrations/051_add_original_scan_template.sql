-- Backup original scan templates so admins can restore after realignment.
ALTER TABLE scan_formats
  ADD COLUMN originalScanTemplate LONGTEXT NULL AFTER scanTemplate,
  ADD COLUMN updatedBy INT NULL AFTER originalScanTemplate,
  ADD COLUMN updatedAt DATETIME NULL AFTER updatedBy;

UPDATE scan_formats
SET originalScanTemplate = scanTemplate
WHERE originalScanTemplate IS NULL
  AND scanTemplate IS NOT NULL;
