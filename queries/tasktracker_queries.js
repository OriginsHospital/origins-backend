const getAllTasksQuery = `SELECT 
    tt.*,
    (select bm.branchCode from branch_master bm where bm.id  = tt.branchId ) as branchName,
    (select dm.name from department_master dm where dm.id  = tt.departmentId  ) as departmentName,
    (select u.fullName from users u where u.id = tt.assignedBy ) as assignedByName,
    (select u.fullName from users u where u.id = tt.assignedTo  ) as assignedToName,
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(comment_data)
            FROM (
                SELECT JSON_OBJECT(
                    'commentId', tc.id,
                    'commentedBy', tc.commentedBy,
                    'commentedByName', (SELECT u.fullName FROM users u WHERE u.id = tc.commentedBy),
                    'commentText', tc.commentText,
                    'createdAt', tc.createdAt
                ) AS comment_data
                FROM task_comments tc
                WHERE tc.taskId = tt.id
                ORDER BY tc.createdAt DESC  
            ) ordered_comments
        ), 
        JSON_ARRAY()
    ) AS comments,
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(task_reference_data)
            FROM (
                SELECT JSON_OBJECT(
                    'ImageId', tri.id,
                    'ImageUrl',tri.imageUrl,
                    'uploadedBy', tri.uploadedBy,
                    'uploadedByName', (SELECT u.fullName FROM users u WHERE u.id = tri.uploadedBy ),
                    'createdAt', tri.createdAt
                ) AS task_reference_data
                FROM task_reference_images tri
                WHERE tri.taskId = tt.id
                ORDER BY tri.createdAt DESC  
            ) ordered_reference_images
        ), 
        JSON_ARRAY()
    ) AS referenceImages
FROM task_tracker tt
LEFT JOIN task_comments tc ON tc.taskId = tt.id
LEFT JOIN task_reference_images tri ON tri.taskId = tt.id
GROUP BY tt.id
ORDER BY 
    CASE 
        WHEN tt.status = 'pending' THEN 1 
        WHEN tt.status = 'completed' THEN 2 
        ELSE 3 
    END,
    tt.createdAt DESC;
`;

const getTaskDetailsQuery = `
SELECT 
    tt.*,
    (select bm.branchCode from branch_master bm where bm.id  = tt.branchId ) as branchName,
    (select dm.name from department_master dm where dm.id  = tt.departmentId  ) as departmentName,
    (select u.fullName from users u where u.id = tt.assignedBy ) as assignedByName,
    (select u.fullName from users u where u.id = tt.assignedTo  ) as assignedToName,
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(comment_data)
            FROM (
                SELECT JSON_OBJECT(
                    'commentId', tc.id,
                    'commentedBy', tc.commentedBy,
                    'commentedByName', (SELECT u.fullName FROM users u WHERE u.id = tc.commentedBy),
                    'commentText', tc.commentText,
                    'createdAt', tc.createdAt
                ) AS comment_data
                FROM task_comments tc
                WHERE tc.taskId = tt.id
                ORDER BY tc.createdAt DESC  
            ) ordered_comments
        ), 
        JSON_ARRAY()
    ) AS comments,
    COALESCE(
        (
            SELECT JSON_ARRAYAGG(task_reference_data)
            FROM (
                SELECT JSON_OBJECT(
                    'ImageId', tri.id,
                    'ImageUrl',tri.imageUrl,
                    'uploadedBy', tri.uploadedBy,
                    'uploadedByName', (SELECT u.fullName FROM users u WHERE u.id = tri.uploadedBy ),
                    'createdAt', tri.createdAt
                ) AS task_reference_data
                FROM task_reference_images tri
                WHERE tri.taskId = tt.id
                ORDER BY tri.createdAt DESC  
            ) ordered_reference_images
        ), 
        JSON_ARRAY()
    ) AS referenceImages
FROM task_tracker tt
WHERE tt.id = :taskId
GROUP BY tt.id;
`;

module.exports = {
  getAllTasksQuery,
  getTaskDetailsQuery
};
