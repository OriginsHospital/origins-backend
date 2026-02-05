-- =====================================================
-- ADD DEPARTMENT AND CATEGORY TO TASKS TABLE
-- =====================================================
-- This migration adds department and category columns to the tasks table
-- =====================================================

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS department VARCHAR(100) NULL COMMENT 'Department for the task',
ADD COLUMN IF NOT EXISTS category VARCHAR(100) NULL COMMENT 'Category for the task';

