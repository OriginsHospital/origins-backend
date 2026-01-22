-- =====================================================
-- CREATE TASKS TABLE FOR TASK TRACKER
-- =====================================================
-- This migration creates the tasks table for the task tracker feature
-- =====================================================

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_name VARCHAR(255) NOT NULL COMMENT 'Name/title of the task',
    description TEXT NULL COMMENT 'Detailed description of the task',
    pending_on VARCHAR(255) NULL COMMENT 'Person or entity the task is pending on',
    remarks TEXT NULL COMMENT 'Additional notes or comments',
    status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending' COMMENT 'Current status of the task',
    start_date DATE NULL COMMENT 'Task start date',
    end_date DATE NULL COMMENT 'Task end date',
    alert_enabled BOOLEAN DEFAULT FALSE COMMENT 'Whether alert/reminder is enabled',
    alert_date DATETIME NULL COMMENT 'Date and time for alert/reminder',
    created_by INT NOT NULL COMMENT 'User ID who created the task',
    assigned_to INT NULL COMMENT 'User ID assigned to the task',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_created_by (created_by),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date),
    INDEX idx_created_at (created_at)
) COMMENT 'Table to store tasks for task tracker feature';

