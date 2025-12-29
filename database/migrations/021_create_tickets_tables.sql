-- Tickets table for hospital floor operations management
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'Auto-generated ticket code (e.g., TCK-2025-0001)',
    task_description TEXT NOT NULL COMMENT 'Task description',
    assigned_to INT NOT NULL COMMENT 'User ID of assigned staff member',
    priority ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM' COMMENT 'Ticket priority level',
    status ENUM('OPEN', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'OPEN' COMMENT 'Ticket status',
    created_by INT NOT NULL COMMENT 'User ID who created the ticket',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_status (status),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at),
    INDEX idx_ticket_code (ticket_code)
) COMMENT 'Table to store operational tickets for hospital floor management';

-- Ticket activity log table for audit trail
CREATE TABLE IF NOT EXISTS ticket_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL COMMENT 'Reference to ticket',
    activity_type ENUM('STATUS_CHANGE', 'REASSIGNED', 'PRIORITY_CHANGE', 'COMMENT', 'CREATED') NOT NULL,
    old_value VARCHAR(255) COMMENT 'Previous value (for status/priority changes)',
    new_value VARCHAR(255) COMMENT 'New value (for status/priority changes)',
    comment_text TEXT COMMENT 'Comment text if activity_type is COMMENT',
    performed_by INT NOT NULL COMMENT 'User ID who performed the action',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_created_at (created_at)
) COMMENT 'Table to store activity logs and audit trail for tickets';

-- Ticket comments table for communication
CREATE TABLE IF NOT EXISTS ticket_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL COMMENT 'Reference to ticket',
    comment_text TEXT NOT NULL COMMENT 'Comment content',
    commented_by INT NOT NULL COMMENT 'User ID who added the comment',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (commented_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_created_at (created_at)
) COMMENT 'Table to store comments on tickets';

