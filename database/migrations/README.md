# Database Migrations

This directory contains SQL migration scripts for database schema updates.

## How to Run Migrations

1. **Manual Execution**: Run the SQL scripts directly in your MySQL client or database management tool
2. **Order**: Run migrations in chronological order (by date/version number)
3. **Backup**: Always backup your database before running migrations

## Migration Files

### add_status_to_state_master.sql

- **Date**: 2024-12-25
- **Description**: Adds `status` ENUM column, `createdBy`, and `updatedBy` columns to `state_master` table
- **Changes**:
  - Adds `status` ENUM('Active', 'Inactive') column
  - Adds `createdBy` INT column
  - Adds `updatedBy` INT column
  - Adds unique constraint on `name` column
  - Updates existing records to 'Active' status

## Notes

- If you encounter errors about duplicate names when adding the unique constraint, you'll need to clean up duplicate records first
- The `status` column defaults to 'Active' for new records
- Existing records will be set to 'Active' status automatically
