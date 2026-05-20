-- Grant access to all branches for specified users
INSERT INTO user_branch_association (userId, branchId, createdAt, updatedAt)
SELECT u.id, bm.id, NOW(), NOW()
FROM users u
CROSS JOIN branch_master bm
WHERE LOWER(TRIM(u.email)) IN (
  'nikhilsuvva77@gmail.com',
  'ajaysivaramburri@gmail.com'
)
AND NOT EXISTS (
  SELECT 1
  FROM user_branch_association uba
  WHERE uba.userId = u.id AND uba.branchId = bm.id
);
