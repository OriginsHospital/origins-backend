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

module.exports = {
  getTicketCommentsForInboxQuery,
  getTicketCommentsCountQuery
};
