// Query to get all tickets with filters, search, and pagination
const getTicketsQuery = `
SELECT 
    t.id,
    t.ticket_code,
    t.task_description,
    t.assigned_to,
    t.priority,
    t.status,
    t.category,
    t.created_by,
    t.created_at,
    t.updated_at,
    JSON_OBJECT(
        'id', u_assigned.id,
        'fullName', u_assigned.fullName,
        'email', u_assigned.email
    ) AS assignedToDetails,
    JSON_OBJECT(
        'id', u_created.id,
        'fullName', u_created.fullName,
        'email', u_created.email
    ) AS createdByDetails,
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(comment_data)
            FROM (
                SELECT JSON_OBJECT(
                    'id', tc.id,
                    'commentText', tc.comment_text,
                    'commentedBy', tc.commented_by,
                    'commentedByName', (SELECT u.fullName FROM users u WHERE u.id = tc.commented_by),
                    'createdAt', tc.created_at
                ) AS comment_data
                FROM ticket_comments tc
                WHERE tc.ticket_id = t.id
                ORDER BY tc.created_at DESC
                LIMIT 5
            ) ordered_comments
        ),
        JSON_ARRAY()
    ) AS recentComments,
    (
        SELECT COUNT(*)
        FROM ticket_comments tc
        WHERE tc.ticket_id = t.id
    ) AS commentCount,
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(tag_name)
            FROM ticket_tags tt
            WHERE tt.ticket_id = t.id
        ),
        JSON_ARRAY()
    ) AS tags
FROM tickets t
INNER JOIN users u_assigned ON u_assigned.id = t.assigned_to
INNER JOIN users u_created ON u_created.id = t.created_by
WHERE 1=1
    AND (:status IS NULL OR t.status = :status)
    AND (:priority IS NULL OR t.priority = :priority)
    AND (:assignedTo IS NULL OR t.assigned_to = :assignedTo)
    AND (:search IS NULL OR t.task_description LIKE CONCAT('%', :search, '%') OR t.ticket_code LIKE CONCAT('%', :search, '%'))
ORDER BY 
    CASE 
        WHEN t.priority = 'HIGH' THEN 1
        WHEN t.priority = 'MEDIUM' THEN 2
        WHEN t.priority = 'LOW' THEN 3
    END,
    CASE 
        WHEN t.status = 'OPEN' THEN 1
        WHEN t.status = 'IN_PROGRESS' THEN 2
        WHEN t.status = 'COMPLETED' THEN 3
    END,
    t.created_at DESC
LIMIT :limit OFFSET :offset;
`;

// Query to get total count for pagination
const getTicketsCountQuery = `
SELECT COUNT(*) as total
FROM tickets t
WHERE 1=1
    AND (:status IS NULL OR t.status = :status)
    AND (:priority IS NULL OR t.priority = :priority)
    AND (:assignedTo IS NULL OR t.assigned_to = :assignedTo)
    AND (:search IS NULL OR t.task_description LIKE CONCAT('%', :search, '%') OR t.ticket_code LIKE CONCAT('%', :search, '%'));
`;

// Query to get ticket details by ID
const getTicketDetailsQuery = `
SELECT 
    t.id,
    t.ticket_code,
    t.task_description,
    t.assigned_to,
    t.priority,
    t.status,
    t.category,
    t.created_by,
    t.created_at,
    t.updated_at,
    JSON_OBJECT(
        'id', u_assigned.id,
        'fullName', u_assigned.fullName,
        'email', u_assigned.email,
        'roleName', rm_assigned.name
    ) AS assignedToDetails,
    JSON_OBJECT(
        'id', u_created.id,
        'fullName', u_created.fullName,
        'email', u_created.email,
        'roleName', rm_created.name
    ) AS createdByDetails,
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(comment_data)
            FROM (
                SELECT JSON_OBJECT(
                    'id', tc.id,
                    'commentText', tc.comment_text,
                    'commentedBy', tc.commented_by,
                    'commentedByName', (SELECT u.fullName FROM users u WHERE u.id = tc.commented_by),
                    'commentedByRole', (SELECT rm.name FROM users u INNER JOIN role_master rm ON rm.id = u.roleId WHERE u.id = tc.commented_by),
                    'createdAt', tc.created_at
                ) AS comment_data
                FROM ticket_comments tc
                WHERE tc.ticket_id = t.id
                ORDER BY tc.created_at DESC
            ) ordered_comments
        ),
        JSON_ARRAY()
    ) AS comments,
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(activity_data)
            FROM (
                SELECT JSON_OBJECT(
                    'id', tal.id,
                    'activityType', tal.activity_type,
                    'oldValue', tal.old_value,
                    'newValue', tal.new_value,
                    'commentText', tal.comment_text,
                    'performedBy', tal.performed_by,
                    'performedByName', (SELECT u.fullName FROM users u WHERE u.id = tal.performed_by),
                    'performedByRole', (SELECT rm.name FROM users u INNER JOIN role_master rm ON rm.id = u.roleId WHERE u.id = tal.performed_by),
                    'createdAt', tal.created_at
                ) AS activity_data
                FROM ticket_activity_logs tal
                WHERE tal.ticket_id = t.id
                ORDER BY tal.created_at DESC
            ) ordered_activities
        ),
        JSON_ARRAY()
    ) AS activityLogs,
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(tag_name)
            FROM ticket_tags tt
            WHERE tt.ticket_id = t.id
        ),
        JSON_ARRAY()
    ) AS tags
FROM tickets t
INNER JOIN users u_assigned ON u_assigned.id = t.assigned_to
INNER JOIN users u_created ON u_created.id = t.created_by
INNER JOIN role_master rm_assigned ON rm_assigned.id = u_assigned.roleId
INNER JOIN role_master rm_created ON rm_created.id = u_created.roleId
WHERE t.id = :ticketId;
`;

// Query to get active staff members for assignment dropdown
const getActiveStaffQuery = `
SELECT 
    u.id,
    u.fullName,
    u.email,
    JSON_OBJECT(
        'id', rm.id,
        'name', rm.name
    ) AS roleDetails
FROM users u
INNER JOIN role_master rm ON rm.id = u.roleId
WHERE u.isAdminVerified = 1 
    AND u.isBlocked = 0
ORDER BY u.fullName ASC;
`;

// Query to generate next ticket code (fallback query)
const getNextTicketCodeQuery = `
SELECT 
    COALESCE(
        MAX(CAST(SUBSTRING(ticket_code, 9) AS UNSIGNED)),
        0
    ) + 1 AS nextNumber
FROM tickets
WHERE ticket_code LIKE CONCAT('TCK-', YEAR(NOW()), '-%');
`;

// Query to get and lock the last ticket for the current year (more atomic)
const getLastTicketCodeWithLockQuery = `
SELECT 
    ticket_code,
    CAST(SUBSTRING(ticket_code, 9) AS UNSIGNED) AS ticket_number
FROM tickets
WHERE ticket_code LIKE CONCAT('TCK-', YEAR(NOW()), '-%')
ORDER BY CAST(SUBSTRING(ticket_code, 9) AS UNSIGNED) DESC
LIMIT 1
FOR UPDATE;
`;

module.exports = {
  getTicketsQuery,
  getTicketsCountQuery,
  getTicketDetailsQuery,
  getActiveStaffQuery,
  getNextTicketCodeQuery,
  getLastTicketCodeWithLockQuery
};
