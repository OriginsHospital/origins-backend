// Query to get all tasks with filters, search, and pagination
// Note: This query will be dynamically built in the service to handle NULL values correctly
const getTasksQuery = (hasStatusFilter, hasSearchFilter, hasUserIdFilter) => {
  let query = `
SELECT 
    t.id,
    t.task_code,
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
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'id', u_assignee.id,
                'fullName', u_assignee.fullName,
                'email', u_assignee.email
            ))
            FROM task_assignees ta
            INNER JOIN users u_assignee ON u_assignee.id = ta.user_id
            WHERE ta.task_id = t.id
        ),
        CASE 
            WHEN t.assigned_to IS NOT NULL THEN
                JSON_ARRAY(JSON_OBJECT(
                    'id', u_assigned.id,
                    'fullName', u_assigned.fullName,
                    'email', u_assigned.email
                ))
            ELSE JSON_ARRAY()
        END
    ) AS assignedToDetails
FROM tasks t
INNER JOIN users u_created ON u_created.id = t.created_by
LEFT JOIN users u_assigned ON u_assigned.id = t.assigned_to
WHERE 1=1`;

  if (hasUserIdFilter) {
    query += ` AND (t.created_by = :userId OR t.assigned_to = :userId)`;
  }

  if (hasStatusFilter) {
    query += ` AND t.status = :status`;
  }

  if (hasSearchFilter) {
    query += ` AND (t.task_name LIKE CONCAT('%', :search, '%') OR t.description LIKE CONCAT('%', :search, '%') OR t.pending_on LIKE CONCAT('%', :search, '%') OR t.task_code LIKE CONCAT('%', :search, '%'))`;
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
const getTasksCountQuery = (
  hasStatusFilter,
  hasSearchFilter,
  hasUserIdFilter
) => {
  let query = `
SELECT COUNT(*) as total
FROM tasks t
WHERE 1=1`;

  if (hasUserIdFilter) {
    query += ` AND (t.created_by = :userId OR t.assigned_to = :userId OR EXISTS (SELECT 1 FROM task_assignees ta WHERE ta.task_id = t.id AND ta.user_id = :userId))`;
  }

  if (hasStatusFilter) {
    query += ` AND t.status = :status`;
  }

  if (hasSearchFilter) {
    query += ` AND (t.task_name LIKE CONCAT('%', :search, '%') OR t.description LIKE CONCAT('%', :search, '%') OR t.pending_on LIKE CONCAT('%', :search, '%') OR t.task_code LIKE CONCAT('%', :search, '%'))`;
  }

  query += `;`;
  return query;
};

// Query to get task details by ID
const getTaskDetailsQuery = `
SELECT 
    t.id,
    t.task_code,
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
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'id', u_assignee.id,
                'fullName', u_assignee.fullName,
                'email', u_assignee.email
            ))
            FROM task_assignees ta
            INNER JOIN users u_assignee ON u_assignee.id = ta.user_id
            WHERE ta.task_id = t.id
        ),
        CASE 
            WHEN t.assigned_to IS NOT NULL THEN
                JSON_ARRAY(JSON_OBJECT(
                    'id', u_assigned.id,
                    'fullName', u_assigned.fullName,
                    'email', u_assigned.email
                ))
            ELSE JSON_ARRAY()
        END
    ) AS assignedToDetails,
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(comment_data)
            FROM (
                SELECT JSON_OBJECT(
                    'commentId', tc.id,
                    'id', tc.id,
                    'commentedBy', tc.commentedBy,
                    'commentedByName', (SELECT u.fullName FROM users u WHERE u.id = tc.commentedBy),
                    'commentedByRole', COALESCE((SELECT rm.name FROM users u INNER JOIN role_master rm ON rm.id = u.roleId WHERE u.id = tc.commentedBy), NULL),
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

// Query to generate next task code (fallback query)
// Format: OR-T-{BRANCH}-{NUMBER} (e.g., OR-T-HYD-0001)
const getNextTaskCodeQuery = `
SELECT 
    COALESCE(
        MAX(CAST(SUBSTRING_INDEX(task_code, '-', -1) AS UNSIGNED)),
        0
    ) + 1 AS nextNumber
FROM tasks
WHERE task_code LIKE CONCAT(:branchCode, '-%');
`;

module.exports = {
  getTasksQuery,
  getTasksCountQuery,
  getTaskDetailsQuery,
  getNextTaskCodeQuery
};
