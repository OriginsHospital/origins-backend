-- =====================================================
-- CREATE TASK_ASSIGNEES TABLE FOR MULTIPLE ASSIGNEES
-- =====================================================
-- This migration creates a junction table to support multiple assignees per task
-- =====================================================

CREATE TABLE IF NOT EXISTS task_assignees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL COMMENT 'Reference to the task',
    user_id INT NOT NULL COMMENT 'Reference to the assigned user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_task_user (task_id, user_id),
    INDEX idx_task_id (task_id),
    INDEX idx_user_id (user_id)
) COMMENT 'Junction table to store multiple assignees for tasks';

