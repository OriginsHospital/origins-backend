-- Associate Dr. Jhansi with Vikarabad branch for appointment booking
INSERT INTO user_branch_association (userId, branchId, createdAt, updatedAt)
SELECT u.id, bm.id, NOW(), NOW()
FROM users u
CROSS JOIN branch_master bm
WHERE LOWER(TRIM(u.email)) = 'jhansi@gmail.com'
  AND bm.name = 'Vikarabad'
  AND bm.isActive = 1
  AND NOT EXISTS (
    SELECT 1
    FROM user_branch_association uba
    WHERE uba.userId = u.id AND uba.branchId = bm.id
  );
