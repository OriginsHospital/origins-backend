const userCountQuery = `
select count(DISTINCT(u.id)) as count from users u inner join user_branch_association uba on u.id = uba.userId 
WHERE uba.branchId in (:branchId) and u.isAdminVerified  = :isVerified;
`;

const getUsersListQuery = `
select u.id , u.fullName , u.email, u.userName , 
JSON_OBJECT(
	'id', u.roleId ,
	'name', rm.name 
) as roleDetails, 
JSON_ARRAYAGG(
	JSON_OBJECT(
		'name', bm.name,
		'id', bm.id 
	) 
) as branchDetails  from users u 
INNER JOIN role_master rm on rm.id = u.roleId 
INNER JOIN user_branch_association uba on uba.userId  = u.id 
INNER JOIN branch_master bm on bm.id = uba.branchId
WHERE u.isAdminVerified = :isVerified and u.isBlocked = 0 and uba.branchId in (:branchId) and u.id <> :userId
GROUP BY u.id, u.fullName, u.email, u.userName;
`;

const getBlockedUsersListQuery = `
select u.id , u.fullName , u.email, u.userName , 
JSON_OBJECT(
	'id', u.roleId ,
	'name', rm.name 
) as roleDetails, 
JSON_ARRAYAGG(
	JSON_OBJECT(
		'name', bm.name,
		'id', bm.id 
	) 
) as branchDetails  from users u 
INNER JOIN role_master rm on rm.id = u.roleId 
INNER JOIN user_branch_association uba on uba.userId  = u.id 
INNER JOIN branch_master bm on bm.id = uba.branchId
WHERE u.isBlocked = 1 
GROUP BY u.id, u.fullName, u.email, u.userName;
`;

const getUsersListQueryWithPagination = `
select u.id , u.fullName , u.email, u.userName , 
JSON_OBJECT(
	'id', u.roleId ,
	'name', rm.name 
) as roleDetails, 
JSON_ARRAYAGG(
	JSON_OBJECT(
		'name', bm.name,
		'id', bm.id 
	) 
) as branchDetails  from users u 
INNER JOIN role_master rm on rm.id = u.roleId 
INNER JOIN user_branch_association uba on uba.userId  = u.id 
INNER JOIN branch_master bm on bm.id = uba.branchId
WHERE u.isAdminVerified = :isVerified and uba.branchId in (:branchId)
GROUP BY u.id, u.fullName, u.email, u.userName
LIMIT :limit OFFSET :offset;
`;

const getUserDetailsQuery = `
SELECT u.id, u.fullName, u.email, u.isAdminVerified, u.isEmailVerified, u.isBlocked,
       JSON_OBJECT('id', rm.id, 'name', rm.name) AS roleDetails,
       (
           SELECT JSON_ARRAYAGG(JSON_OBJECT('id', bm.id, 'name', bm.name))
           FROM user_branch_association uba
           INNER JOIN branch_master bm ON bm.id = uba.branchId
           WHERE uba.userId = u.id
       ) AS branchDetails,
       (
           SELECT
               CASE WHEN COUNT(mm.id) > 0 THEN
                   JSON_ARRAYAGG(
                       JSON_OBJECT('id', mm.id, 'name', mm.name, 'accessType', uma.accessType)
                   )
               ELSE
                   JSON_ARRAY()
               END
           FROM user_module_associations uma
           LEFT JOIN module_master mm ON mm.id = uma.moduleId
           WHERE uma.userId = u.id
       ) AS moduleList
FROM users u
INNER JOIN role_master rm ON rm.id = u.roleId
WHERE u.id = :userId
GROUP BY u.id, u.fullName, u.email, u.isAdminVerified, u.isEmailVerified, u.isBlocked;
`;

const userProfileQuery = `
SELECT JSON_OBJECT(
    'userId', up.userId,
    'userName', up.userName,
    'fullName', up.fullName,
    'email', up.email,
    'phoneNo', up.phoneNo,
    'addressLine1', up.addressLine1,
    'addressLine2', up.addressLine2,
    'state', up.state,
    'country', up.country,
    'profileCompletePercent', 
        IF(up.userName IS NULL, 0, 10) + 
        IF(up.fullName IS NULL, 0, 10) + 
        IF(up.email IS NULL, 0, 20) + 
        IF(up.phoneNo IS NULL, 0, 20) + 
        IF(up.addressLine1 IS NULL, 0, 20) + 
        IF(up.state IS NULL, 0, 10) + 
        IF(up.country IS NULL, 0, 10)
) AS profileDetails,
(
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'userId', uba.userId,
            'branchId', uba.branchId,
            'branchName', bm.name,
            'branchCode', bm.branchCode
        )
    )
    FROM user_branch_association uba
    INNER JOIN branch_master bm ON bm.id = uba.branchId
    WHERE uba.userId = up.userId
) AS branchDetails,
JSON_OBJECT(
	'userId', up.userId,
	'shiftFrom', TIME_FORMAT(cdm.shiftFrom, '%H:%i'),
	'shiftTo', TIME_FORMAT(cdm.shiftTo, '%H:%i')
) as shiftDetails
FROM user_profile up
LEFT JOIN consultation_doctor_master cdm on cdm.userId = up.userId
where up.userId = :userId;
`;
const branchRequestHistoryQuery = `
WITH branch_data_extracted AS (
    SELECT 
        bca.id AS request_id,
        jt.branchId
    FROM 
        branch_change_request bca,
        JSON_TABLE(bca.branchData, '$[*]' COLUMNS(branchId INT PATH '$')) AS jt
),
original_branch_details AS (
    SELECT DISTINCT
        bca.userId,
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'name', bm.name,
                'id', bm.id 
            )
        ) AS originalBranchDetails
    FROM 
        branch_change_request bca
    INNER JOIN 
        user_branch_association uba ON uba.userId = bca.userId 
    INNER JOIN 
        branch_master bm ON bm.id = uba.branchId
    WHERE 
        bca.userId = :userId
    GROUP BY 
        bca.userId
)
SELECT 
    bca.userId,
    bca.requestStatus,
    bca.requestedDate,
    bca.requestAcceptedDate,
    obd.originalBranchDetails,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'id', bm.id,
            'name', bm.name
        )
    ) AS requestBranchDetails
FROM 
    branch_change_request bca
INNER JOIN 
    original_branch_details obd ON obd.userId = bca.userId
LEFT JOIN 
    branch_data_extracted bde ON bca.id = bde.request_id
LEFT JOIN 
    branch_master bm ON bm.id = bde.branchId
WHERE 
    bca.userId = :userId
GROUP BY 
    bca.userId, bca.requestStatus, bca.requestedDate, bca.requestAcceptedDate;
`;

const getUserSuggestionQuery = `
select u.id, u.fullName as name from users u where u.fullName LIKE :searchQuery OR u.email like :searchQuery;
`;

const getValidUsersQuery = `
select u.id, u.fullName, u.email 
FROM users u
WHERE u.isAdminVerified = 1 and u.isBlocked = 0 
ORDER BY u.fullName ASC
`;

module.exports = {
  userCountQuery,
  getUsersListQuery,
  getUserDetailsQuery,
  getUsersListQueryWithPagination,
  userProfileQuery,
  branchRequestHistoryQuery,
  getUserSuggestionQuery,
  getBlockedUsersListQuery,
  getValidUsersQuery
};
