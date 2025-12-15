const getRoleDetails = `
select rm.id , rm.name, rm.createdAt, rm.updatedAt, 
CASE WHEN count(mm.id) > 0 THEN JSON_ARRAYAGG(
	JSON_OBJECT(
		'id', mm.id,
		'name', mm.name,
		'accessType', rma.accessType 
	) 
) ELSE NULL
END as moduleList from role_master rm 
LEFT JOIN role_module_associations rma on rm.id  = rma.roleId 
LEFT JOIN module_master mm on rma.moduleId  = mm.id and mm.isActive  = 1
where rm.id = :roleId
GROUP BY rm.id, rm.name, rm.createdAt, rm.updatedAt;
`;

module.exports = {
  getRoleDetails
};
