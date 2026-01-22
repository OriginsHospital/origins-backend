-- =====================================================
-- ADD SUMMARY COLUMN TO TICKETS TABLE
-- =====================================================
-- This migration adds a summary column to the tickets table
-- to store a brief summary of the ticket
-- =====================================================

-- Add summary column to tickets table
ALTER TABLE tickets
ADD COLUMN summary TEXT NULL 
COMMENT 'Brief summary of the ticket' 
AFTER task_description;

