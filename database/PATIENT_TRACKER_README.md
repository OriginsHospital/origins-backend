# Patient Tracker Database Tables

## Overview

This document describes the database table structure for the Patient Tracker feature, which stores comprehensive patient treatment tracking information including basic details, treatment status, financial information, embryology data, and UPT results.

## Table: `patient_tracker`

### Table Creation Commands

#### Option 1: With Generated Columns (MySQL 5.7.6+ or MariaDB 10.2.6+)

```bash
mysql -u your_username -p your_database < create_patient_tracker_table.sql
```

#### Option 2: Simplified Version (Compatible with Older MySQL)

```bash
mysql -u your_username -p your_database < create_patient_tracker_table_simple.sql
```

### Table Attributes

| Column Name                  | Data Type     | Nullable | Description                                                     |
| ---------------------------- | ------------- | -------- | --------------------------------------------------------------- |
| **id**                       | INT           | NOT NULL | Primary key, auto-increment                                     |
| **date**                     | DATE          | NOT NULL | Tracker entry date                                              |
| **branchId**                 | INT           | NOT NULL | Foreign key to `branch_master(id)`                              |
| **patientId**                | VARCHAR(100)  | NOT NULL | Patient ID from patient_master                                  |
| **patientName**              | VARCHAR(255)  | NOT NULL | Patient full name                                               |
| **mobileNumber**             | VARCHAR(15)   | YES      | Patient mobile number                                           |
| **referralSourceId**         | INT           | YES      | Foreign key to `referral_type_master(id)`                       |
| **referralName**             | VARCHAR(255)  | YES      | Referral name                                                   |
| **plan**                     | VARCHAR(255)  | YES      | Treatment plan                                                  |
| **treatmentType**            | ENUM          | NOT NULL | 'IVF', 'OI-TI', 'IUI'                                           |
| **cycleStatus**              | ENUM          | NOT NULL | 'Not Started', 'Registered', 'Running', 'Complete', 'Cancelled' |
| **stageOfCycle**             | VARCHAR(255)  | YES      | Current stage of cycle                                          |
| **packageName**              | VARCHAR(255)  | YES      | Package name                                                    |
| **packageAmount**            | DECIMAL(10,2) | YES      | Total package amount (default: 0.00)                            |
| **registrationAmount**       | DECIMAL(10,2) | YES      | Registration amount (default: 0.00)                             |
| **paidAmount**               | DECIMAL(10,2) | YES      | Total paid amount (default: 0.00)                               |
| **pendingAmount**            | DECIMAL(10,2) | YES      | Pending amount (calculated or stored)                           |
| **numberOfEmbryos**          | INT           | YES      | Total embryos (default: 0)                                      |
| **numberOfEmbryosUsed**      | INT           | YES      | Embryos used (default: 0)                                       |
| **numberOfEmbryosDiscarded** | INT           | YES      | Embryos discarded (default: 0)                                  |
| **lastRenewalDate**          | DATE          | YES      | Last renewal date                                               |
| **embryosRemaining**         | INT           | YES      | Embryos remaining (calculated or stored)                        |
| **uptResult**                | ENUM          | YES      | 'Positive', 'Negative', 'Others'                                |
| **uptManualEntry**           | VARCHAR(255)  | YES      | Manual entry if UPT = 'Others'                                  |
| **createdBy**                | INT           | YES      | Foreign key to `users(id)`                                      |
| **updatedBy**                | INT           | YES      | Foreign key to `users(id)`                                      |
| **createdAt**                | DATETIME      | NOT NULL | Auto-set on insert                                              |
| **updatedAt**                | DATETIME      | NOT NULL | Auto-updated on update                                          |

### Foreign Key Relationships

1. **branchId** → `branch_master(id)`

   - ON DELETE RESTRICT
   - ON UPDATE CASCADE

2. **referralSourceId** → `referral_type_master(id)`

   - ON DELETE SET NULL
   - ON UPDATE CASCADE

3. **createdBy** → `users(id)`

   - ON DELETE SET NULL
   - ON UPDATE CASCADE

4. **updatedBy** → `users(id)`
   - ON DELETE SET NULL
   - ON UPDATE CASCADE

### Indexes

The table includes the following indexes for optimized query performance:

- `idx_date` - Index on date column
- `idx_branchId` - Index on branchId column
- `idx_patientId` - Index on patientId column
- `idx_date_branch` - Composite index on (date, branchId)
- `idx_treatment_type` - Index on treatmentType column
- `idx_cycle_status` - Index on cycleStatus column
- `idx_created_at` - Index on createdAt column

## Usage Examples

### Insert Patient Tracker Record

```sql
INSERT INTO patient_tracker (
    date, branchId, patientId, patientName, mobileNumber,
    treatmentType, cycleStatus, packageName, packageAmount,
    registrationAmount, paidAmount, numberOfEmbryos,
    numberOfEmbryosUsed, uptResult, createdBy
) VALUES (
    '2025-01-15',           -- date
    1,                       -- branchId
    'ORI000013',            -- patientId
    'John Doe',             -- patientName
    '9876543210',           -- mobileNumber
    'IVF',                  -- treatmentType
    'Running',              -- cycleStatus
    'Premium Package',      -- packageName
    50000.00,               -- packageAmount
    5000.00,                -- registrationAmount
    10000.00,               -- paidAmount
    50000.00 - 10000.00,    -- pendingAmount (calculated)
    5,                      -- numberOfEmbryos
    2,                      -- numberOfEmbryosUsed
    5 - 2,                  -- embryosRemaining (calculated)
    'Positive',             -- uptResult
    1                       -- createdBy (user ID)
);
```

### Query with Filters (for Summary Page)

```sql
SELECT
    pt.id,
    pt.date,
    pt.patientId,
    pt.patientName,
    pt.mobileNumber,
    bm.name AS branchName,
    pt.treatmentType,
    pt.cycleStatus,
    pt.stageOfCycle,
    pt.packageName,
    pt.packageAmount,
    pt.paidAmount,
    pt.pendingAmount,
    pt.numberOfEmbryos,
    pt.numberOfEmbryosUsed,
    pt.embryosRemaining,
    pt.uptResult
FROM patient_tracker pt
LEFT JOIN branch_master bm ON bm.id = pt.branchId
WHERE
    pt.date >= '2025-01-01'      -- fromDate
    AND pt.date <= '2025-01-31'  -- toDate
    AND pt.branchId = 1          -- branchId (or NULL for all)
ORDER BY pt.date DESC;
```

### Update Patient Tracker Record

```sql
UPDATE patient_tracker
SET
    cycleStatus = 'Complete',
    paidAmount = 50000.00,
    pendingAmount = (packageAmount - 50000.00),
    updatedBy = 1,
    updatedAt = CURRENT_TIMESTAMP
WHERE id = 1;
```

## Notes

1. **Calculated Fields**:

   - `pendingAmount` = `packageAmount - paidAmount`
   - `embryosRemaining` = `numberOfEmbryos - numberOfEmbryosUsed`

   In the simplified version, these need to be calculated in the application code. In the version with generated columns, they are auto-calculated by MySQL.

2. **Data Validation**:

   - `treatmentType` must be one of: 'IVF', 'OI-TI', 'IUI'
   - `cycleStatus` must be one of: 'Not Started', 'Registered', 'Running', 'Complete', 'Cancelled'
   - `uptResult` must be one of: 'Positive', 'Negative', 'Others'

3. **Referential Integrity**:
   - Ensure `branchId` exists in `branch_master` before inserting
   - Ensure `referralSourceId` exists in `referral_type_master` (if provided)
   - Ensure `createdBy` and `updatedBy` exist in `users` table (if provided)

## Migration Steps

1. Backup your existing database:

   ```bash
   mysqldump -u username -p database_name > backup_$(date +%Y%m%d).sql
   ```

2. Run the table creation script:

   ```bash
   mysql -u username -p database_name < create_patient_tracker_table_simple.sql
   ```

3. Verify the table was created:

   ```sql
   DESCRIBE patient_tracker;
   SHOW CREATE TABLE patient_tracker;
   ```

4. Test with a sample insert (optional):

   ```sql
   -- Insert a test record
   INSERT INTO patient_tracker (date, branchId, patientId, patientName, treatmentType, cycleStatus, createdBy)
   VALUES (CURDATE(), 1, 'TEST001', 'Test Patient', 'IVF', 'Not Started', 1);

   -- Verify
   SELECT * FROM patient_tracker WHERE patientId = 'TEST001';
   ```

## Troubleshooting

### Error: Foreign key constraint fails

- Ensure all referenced tables (`branch_master`, `referral_type_master`, `users`) exist
- Verify the foreign key values exist in the referenced tables

### Error: Generated column syntax error

- Use the simplified version (`create_patient_tracker_table_simple.sql`) if your MySQL version doesn't support generated columns (MySQL < 5.7.6 or MariaDB < 10.2.6)

### Error: ENUM value not valid

- Ensure the values match exactly: 'IVF' (not 'ivf'), 'Positive' (not 'positive'), etc.
- Check for trailing spaces or special characters

## Related Files

- `create_patient_tracker_table.sql` - Table with generated columns (MySQL 5.7.6+)
- `create_patient_tracker_table_simple.sql` - Simplified version (older MySQL)
- `patient_tracker_queries.sql` - Example INSERT, SELECT, UPDATE, DELETE queries
