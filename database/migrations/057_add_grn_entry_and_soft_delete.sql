-- GRN entry audit (createdBy) and stock-line soft delete fields
SET @schema = 'stockmanagement';

SET @tablename = 'grn_master';
SET @columnname = 'createdBy';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = @schema
      AND table_name = @tablename
      AND column_name = @columnname
  ) > 0,
  'SELECT ''Column createdBy already exists on grn_master.''',
  'ALTER TABLE stockmanagement.grn_master ADD COLUMN createdBy INT NULL AFTER invoiceNumber'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @tablename = 'grn_items_associations';
SET @columnname = 'isDeleted';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = @schema
      AND table_name = @tablename
      AND column_name = @columnname
  ) > 0,
  'SELECT ''Column isDeleted already exists on grn_items_associations.''',
  'ALTER TABLE stockmanagement.grn_items_associations ADD COLUMN isDeleted TINYINT(1) NOT NULL DEFAULT 0'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'deletedQuantity';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = @schema
      AND table_name = @tablename
      AND column_name = @columnname
  ) > 0,
  'SELECT ''Column deletedQuantity already exists on grn_items_associations.''',
  'ALTER TABLE stockmanagement.grn_items_associations ADD COLUMN deletedQuantity BIGINT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'deletedBy';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = @schema
      AND table_name = @tablename
      AND column_name = @columnname
  ) > 0,
  'SELECT ''Column deletedBy already exists on grn_items_associations.''',
  'ALTER TABLE stockmanagement.grn_items_associations ADD COLUMN deletedBy INT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'deletedAt';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = @schema
      AND table_name = @tablename
      AND column_name = @columnname
  ) > 0,
  'SELECT ''Column deletedAt already exists on grn_items_associations.''',
  'ALTER TABLE stockmanagement.grn_items_associations ADD COLUMN deletedAt DATETIME NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
