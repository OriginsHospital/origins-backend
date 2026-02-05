// Query to get all ticket comments for inbox
const getTicketCommentsForInboxQuery = `
SELECT 
    tc.id,
    tc.ticket_id,
    tc.comment_text,
    tc.commented_by,
    tc.created_at,
    t.ticket_code,
    t.task_description,
    t.status as ticket_status,
    JSON_OBJECT(
        'id', u_commenter.id,
        'fullName', u_commenter.fullName,
        'email', u_commenter.email
    ) AS commenterDetails,
    JSON_OBJECT(
        'id', u_assigned.id,
        'fullName', u_assigned.fullName
    ) AS assignedToDetails
FROM ticket_comments tc
INNER JOIN tickets t ON t.id = tc.ticket_id
INNER JOIN users u_commenter ON u_commenter.id = tc.commented_by
LEFT JOIN users u_assigned ON u_assigned.id = t.assigned_to
WHERE (:userId IS NULL OR t.assigned_to = :userId OR t.created_by = :userId)
ORDER BY tc.created_at DESC
LIMIT :limit OFFSET :offset;
`;

// Query to get count of ticket comments for inbox
const getTicketCommentsCountQuery = `
SELECT COUNT(*) as total
FROM ticket_comments tc
INNER JOIN tickets t ON t.id = tc.ticket_id
WHERE (:userId IS NULL OR t.assigned_to = :userId OR t.created_by = :userId);
`;

// Query to get ticket assignment notifications for inbox
const getTicketAssignmentNotificationsQuery = `
SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.related_entity_id as ticket_id,
    n.is_read,
    n.created_at,
    t.ticket_code,
    t.task_description,
    t.status as ticket_status,
    t.priority,
    JSON_OBJECT(
        'id', u_creator.id,
        'fullName', u_creator.fullName,
        'email', u_creator.email
    ) AS creatorDetails
FROM notifications n
INNER JOIN tickets t ON t.id = n.related_entity_id
INNER JOIN users u_creator ON u_creator.id = t.created_by
WHERE n.user_id = :userId 
  AND n.type = 'ticket_assigned'
  AND n.related_entity_type = 'ticket'
ORDER BY n.created_at DESC
LIMIT :limit OFFSET :offset;
`;

// Query to get count of ticket assignment notifications
const getTicketAssignmentNotificationsCountQuery = `
SELECT COUNT(*) as total
FROM notifications n
WHERE n.user_id = :userId 
  AND n.type = 'ticket_assigned'
  AND n.related_entity_type = 'ticket';
`;

module.exports = {
  getTicketCommentsForInboxQuery,
  getTicketCommentsCountQuery,
  getTicketAssignmentNotificationsQuery,
  getTicketAssignmentNotificationsCountQuery
};
