-- Add category field to tickets table
ALTER TABLE tickets 
ADD COLUMN category VARCHAR(100) NULL COMMENT 'Ticket category (e.g., Maintenance, Equipment, Supplies, Follow-up)',
ADD INDEX idx_category (category);

-- Create ticket_tags table for many-to-many relationship
CREATE TABLE IF NOT EXISTS ticket_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL COMMENT 'Reference to ticket',
    tag_name VARCHAR(50) NOT NULL COMMENT 'Tag name',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_tag_name (tag_name),
    UNIQUE KEY unique_ticket_tag (ticket_id, tag_name)
) COMMENT 'Table to store tags associated with tickets';

