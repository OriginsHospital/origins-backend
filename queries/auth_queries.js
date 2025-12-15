const getUserInfoQuery = `
SELECT 
    u.id, 
    u.fullName, 
    u.email,
    u.userName,
    JSON_OBJECT('id', rm.id, 'name', rm.name) AS roleDetails,
    (
        SELECT JSON_ARRAYAGG(JSON_OBJECT('id', bm.id, 'name', bm.name , 'branchCode', bm.branchCode))
        FROM user_branch_association uba
        INNER JOIN branch_master bm ON bm.id = uba.branchId
        WHERE uba.userId = u.id
    ) AS branchDetails,
    (
        SELECT 
            CASE WHEN COUNT(mm.id) > 0 THEN
                JSON_ARRAYAGG(
                    JSON_OBJECT('id', mm.id, 'name', mm.name, 'accessType', uma.accessType, 'enum', mm.moduleEnum)
                )
            ELSE
                JSON_ARRAY()
            END
        FROM user_module_associations uma
        LEFT JOIN module_master mm ON mm.id = uma.moduleId
        WHERE uma.userId = u.id
    ) AS moduleList
FROM 
    users u
INNER JOIN role_master rm ON rm.id = u.roleId
WHERE 
    u.id = :userId
GROUP BY 
    u.id, u.fullName, u.email, rm.id, rm.name, u.userName;
`;

const loginWithEmailUserNameQuery = `
select u.id , u.password , u.email , u.userName, u.fullName, u.isAdminVerified, u.isBlocked  
from users u 
where u.email = :email or u.userName  = :userName;
`;

const rejectUserQuery = `
UPDATE users 
SET isBlocked = CASE 
	WHEN :isBlocked = 1 then 1 
	WHEN :isBlocked = 0 then 0
	ELSE isBlocked
END WHERE id = :userId;
`;
const getStateQuery = `SELECT id,name FROM state_master`;

const userPasswordLogsQuery = `
INSERT INTO user_password_logs (userId, email, password)
VALUES (:userId, :email, :password)
ON DUPLICATE KEY UPDATE email = :email, password = :password
`;

module.exports = {
  getUserInfoQuery,
  loginWithEmailUserNameQuery,
  rejectUserQuery,
  userPasswordLogsQuery
};
