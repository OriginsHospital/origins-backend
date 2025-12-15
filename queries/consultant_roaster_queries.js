const getAllConsultantRoastersList = `
SELECT 
    cr.*, bm.branchCode as branch, 
    ctm.name as consultantTypeName,
    JSON_OBJECT('id', u.id, 'fullName', u.fullName) AS createdBy
from consultant_roaster cr 
INNER JOIN branch_master bm ON bm.id = cr.branchId
INNER JOIN consultant_type_master ctm ON ctm.id = cr.consultantTypeId
INNER JOIN users u ON u.id = cr.createdBy
GROUP BY cr.id
ORDER BY 
    cr.updatedAt DESC;
`;

module.exports = {
  getAllConsultantRoastersList
};
