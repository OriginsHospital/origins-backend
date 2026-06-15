-- Grant all active branches to Admin users (roleId = 1)
INSERT INTO user_branch_association (userId, branchId, createdAt, updatedAt)
SELECT u.id, bm.id, NOW(), NOW()
FROM users u
CROSS JOIN branch_master bm
WHERE u.roleId = 1
  AND bm.isActive = 1
  AND NOT EXISTS (
    SELECT 1
    FROM user_branch_association uba
    WHERE uba.userId = u.id AND uba.branchId = bm.id
  );
