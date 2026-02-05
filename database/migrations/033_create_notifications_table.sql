-- =====================================================
-- CREATE NOTIFICATIONS TABLE
-- =====================================================
-- This migration creates a notifications table to store
-- various notifications including ticket assignments
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'User ID who should receive this notification',
    type VARCHAR(50) NOT NULL COMMENT 'Type of notification (e.g., ticket_assigned, ticket_comment, task_assigned)',
    title VARCHAR(255) NOT NULL COMMENT 'Notification title',
    message TEXT NOT NULL COMMENT 'Notification message/content',
    related_entity_type VARCHAR(50) NULL COMMENT 'Type of related entity (e.g., ticket, task)',
    related_entity_id INT NULL COMMENT 'ID of related entity (e.g., ticket_id, task_id)',
    is_read BOOLEAN DEFAULT FALSE COMMENT 'Whether the notification has been read',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'When the notification was created',
    read_at DATETIME NULL COMMENT 'When the notification was read',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    INDEX idx_related_entity (related_entity_type, related_entity_id)
) COMMENT 'Table to store user notifications';

