-- =====================================================
-- ADD TASK CODE COLUMN TO TASKS TABLE
-- =====================================================
-- This migration adds the task_code column to the tasks table
-- Format: OR-{BRANCH}-{NUMBER} (e.g., OR-HYD-0001)
-- =====================================================

ALTER TABLE tasks 
ADD COLUMN task_code VARCHAR(50) NULL COMMENT 'Auto-generated task code (e.g., OR-HYD-0001)' AFTER id;

-- Add unique index for task_code
CREATE UNIQUE INDEX idx_task_code ON tasks(task_code);

-- Add index for better query performance
CREATE INDEX idx_task_code_branch ON tasks(task_code(10));

