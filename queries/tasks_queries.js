// Query to get all tasks with filters, search, and pagination
// Note: This query will be dynamically built in the service to handle NULL values correctly
const getTasksQuery = (hasStatusFilter, hasSearchFilter) => {
  let query = `
SELECT 
    t.id,
    t.task_name,
    t.description,
    t.pending_on,
    t.remarks,
    t.status,
    t.start_date,
    t.end_date,
    t.alert_enabled,
    t.alert_date,
    t.created_by,
    t.assigned_to,
    t.created_at,
    t.updated_at,
    JSON_OBJECT(
        'id', u_created.id,
        'fullName', u_created.fullName,
        'email', u_created.email
    ) AS createdByDetails,
    JSON_OBJECT(
        'id', u_assigned.id,
        'fullName', u_assigned.fullName,
        'email', u_assigned.email
    ) AS assignedToDetails
FROM tasks t
INNER JOIN users u_created ON u_created.id = t.created_by
LEFT JOIN users u_assigned ON u_assigned.id = t.assigned_to
WHERE 1=1`;

  if (hasStatusFilter) {
    query += ` AND t.status = :status`;
  }

  if (hasSearchFilter) {
    query += ` AND (t.task_name LIKE CONCAT('%', :search, '%') OR t.description LIKE CONCAT('%', :search, '%') OR t.pending_on LIKE CONCAT('%', :search, '%'))`;
  }

  query += `
ORDER BY 
    CASE 
        WHEN t.status = 'Pending' THEN 1
        WHEN t.status = 'In Progress' THEN 2
        WHEN t.status = 'Completed' THEN 3
        WHEN t.status = 'Cancelled' THEN 4
    END,
    t.created_at DESC
LIMIT :limit OFFSET :offset;
`;

  return query;
};

// Query to get total count for pagination
const getTasksCountQuery = (hasStatusFilter, hasSearchFilter) => {
  let query = `
SELECT COUNT(*) as total
FROM tasks t
WHERE 1=1`;

  if (hasStatusFilter) {
    query += ` AND t.status = :status`;
  }

  if (hasSearchFilter) {
    query += ` AND (t.task_name LIKE CONCAT('%', :search, '%') OR t.description LIKE CONCAT('%', :search, '%') OR t.pending_on LIKE CONCAT('%', :search, '%'))`;
  }

  query += `;`;
  return query;
};

// Query to get task details by ID
const getTaskDetailsQuery = `
SELECT 
    t.id,
    t.task_name,
    t.description,
    t.pending_on,
    t.remarks,
    t.status,
    t.start_date,
    t.end_date,
    t.alert_enabled,
    t.alert_date,
    t.created_by,
    t.assigned_to,
    t.created_at,
    t.updated_at,
    JSON_OBJECT(
        'id', u_created.id,
        'fullName', u_created.fullName,
        'email', u_created.email
    ) AS createdByDetails,
    JSON_OBJECT(
        'id', u_assigned.id,
        'fullName', u_assigned.fullName,
        'email', u_assigned.email
    ) AS assignedToDetails,
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(comment_data)
            FROM (
                SELECT JSON_OBJECT(
                    'commentId', tc.id,
                    'commentedBy', tc.commentedBy,
                    'commentedByName', COALESCE((SELECT u.fullName FROM users u WHERE u.id = tc.commentedBy), 'Unknown'),
                    'commentedByRole', COALESCE((SELECT r.name FROM users u INNER JOIN roles r ON r.id = u.roleId WHERE u.id = tc.commentedBy), ''),
                    'commentText', tc.commentText,
                    'createdAt', tc.createdAt
                ) AS comment_data
                FROM task_comments tc
                WHERE tc.taskId = t.id
                ORDER BY tc.createdAt DESC
            ) ordered_comments
        ), 
        JSON_ARRAY()
    ) AS comments
FROM tasks t
INNER JOIN users u_created ON u_created.id = t.created_by
LEFT JOIN users u_assigned ON u_assigned.id = t.assigned_to
WHERE t.id = :taskId;
`;

module.exports = {
  getTasksQuery,
  getTasksCountQuery,
  getTaskDetailsQuery
};
