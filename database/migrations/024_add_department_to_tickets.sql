-- =====================================================
-- ADD DEPARTMENT COLUMN TO TICKETS TABLE
-- =====================================================
-- This migration adds a department column to the tickets table
-- to categorize tickets by department (Nursing, Pharmacy, Administration, IPD, etc.)
-- =====================================================

-- Add department column to tickets table
ALTER TABLE tickets
ADD COLUMN department VARCHAR(100) NULL 
COMMENT 'Department category (e.g., Nursing, Pharmacy, Administration, IPD, OPD, Laboratory, Radiology, IT Support, Housekeeping, Security, Other)' 
AFTER priority;

-- Add index for department for faster filtering
CREATE INDEX idx_department ON tickets(department);

