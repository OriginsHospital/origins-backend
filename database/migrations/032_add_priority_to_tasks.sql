-- =====================================================
-- ADD PRIORITY COLUMN TO TASKS TABLE
-- =====================================================
-- This migration adds a priority field to the tasks table
-- to match the functionality of tickets
-- =====================================================

ALTER TABLE tasks
ADD COLUMN priority ENUM('LOW', 'MEDIUM', 'HIGH') NULL DEFAULT 'MEDIUM' COMMENT 'Priority level of the task';

