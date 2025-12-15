const getAllAppointmentReasonsQuery = `
select
	arm.id,
	arm.name,
	arm.appointmentCharges,
	arm.isActive,
	arm.isSpouse,
	arm.visit_type,
	(select vtm.name from visit_type_master vtm where vtm.id = arm.visit_type) as visitTypeName,
	(select u.fullName from users u where u.id = arm.createdBy) as createdBy ,
	(select u.fullName from users u where u.id = arm.updatedBy) as updatedBy 
from
	appointment_reason_master arm where arm.isOther !=1
`;

const getAllLabTestSampleTypesQuery = `
select
	ltstm.id, ltstm.name,ltstm.isActive,
	(select u.fullName from users u where u.id = ltstm.createdBy) as createdBy,
	(select u.fullName from users u where u.id = ltstm.updatedBy) as updatedBy
from
	lab_test_sample_type_master ltstm
`;

const getAllLabTestGroupQuery = `
select ltgm.id, ltgm.name, ltgm.isActive,
	(select u.fullName from users u where u.id = ltgm.createdBy) as createdBy,
	(select u.fullName from users u where u.id = ltgm.updatedBy) as updatedBy
from 
	lab_test_group_master ltgm 
`;
const getAllLabTestsQuery = `
select 
	ltmba.id,
	ltm.id as labTestId,
	ltmba.branchId,
	(select bm.branchCode from branch_master bm where bm.id = ltmba.branchId ) as branchName,
	ltm.name,
	ltmba.isOutSourced,
	ltmba.amount,
	ltmba.labTestGroupId ,
	ltmba.sampleTypeId ,
	(select ltgm.name from lab_test_group_master ltgm where ltgm.id = ltmba.labTestGroupId) as labTestGroupName,
	(select ltstm.name from lab_test_sample_type_master ltstm where ltstm.id = ltmba.sampleTypeId) as labTestSampleTypeName,
	(select u.fullName from users u where u.id = ltmba.createdBy) as createdBy,
	(select u.fullName from users u where u.id = ltmba.updatedBy) as updatedBy,
	ltmba.isActive 
from 
	lab_test_master ltm
	INNER JOIN lab_test_master_branch_association ltmba ON ltmba.labTestId  = ltm.id 
`;

const getAllScansQuery = `
select 
	smba.id,
	sm.id as scanId,
	smba.branchId,
	(select bm.branchCode from branch_master bm where bm.id = smba.branchId ) as branchName,
	sm.name,
	smba.isFormFRequired,
	smba.amount,
	(select u.fullName from users u where u.id = smba.createdBy) as createdBy,
	(select u.fullName from users u where u.id = smba.updatedBy) as updatedBy,
	smba.isActive 
from scan_master sm 
INNER JOIN scan_master_branch_association smba ON smba.scanId  = sm.id
`;

const getAllEmbryologyQuery = `
select 
	emba.id,
	em.id as embryologyId,
	emba.branchId,
	(select bm.branchCode from branch_master bm where bm.id = emba.branchId ) as branchName,
	em.name,
	emba.amount,
	(select u.fullName from users u where u.id = emba.createdBy) as createdBy,
	emba.isActive
from embryology_master em 
INNER JOIN embryology_master_branch_association emba ON emba.embryologyId  = em.id
`;

const getAllPharmacyItemsQuery = `
SELECT 
    im.id, 
    im.itemName,
    JSON_OBJECT('id', itm.id, 'name', itm.name) AS inventoryType,
    JSON_OBJECT('id', mm.id, 'manufacturer', mm.manufacturer) AS manufacturer,
    im.hsnCode,
    im.categoryName,
    JSON_OBJECT('id', tcm.id, 'categoryName', tcm.categoryName) AS taxCategory,
    im.isActive,
	im.departmentId ,
    (select dm.name from defaultdb.department_master dm where dm.id = im.departmentId) as departmentName,
    JSON_OBJECT('id', u.id, 'fullName', u.fullName) AS createdBy,
    im.createdAt,
    im.updatedAt
FROM stockmanagement.item_master im
LEFT JOIN stockmanagement.inventory_type_master itm ON itm.id = im.inventoryType
LEFT JOIN stockmanagement.manufacturer_master mm ON mm.id = im.manufacturerName
LEFT JOIN stockmanagement.tax_category_master tcm ON tcm.id = im.taxCategory
LEFT JOIN users u ON u.id = im.createdBy;
`;

const getAllIncidentsQuery = `select
	im.id,
	im.incidentDate ,
	im.description,
	im.rootCauseAnalysis ,
	im.impact ,
	im.action ,
	im.preventiveMeasures ,
	im.isActive ,
	(
		SELECT 
			JSON_ARRAYAGG(
				JSON_OBJECT(
					'id', u.id,
					'fullName', u.fullName
				)
        ) AS responsibleEmployees from users u where FIND_IN_SET(u.id, im.responsibleEmployees) 
	) as responsibleEmployees,
	(select u.fullName from users u where u.id = im.createdBy) as createdBy,
	(select u.fullName from users u where u.id = im.updatedBy) as updatedBy
from
	incident_master im
ORDER BY im.incidentDate DESC
`;

const getDepartmentsListQuery = `
select 
	dm.id, 
	dm.name, 
	dm.isActive,
	(select u.fullName from users u where u.id = dm.createdBy) as createdBy,
	(select u.fullName from users u where u.id = dm.updatedBy) as updatedBy
from department_master dm
`;
const getVendorsListQuery = `
select
	vm.id,
	vm.name,
	vm.departmentId,
	vm.isActive,
	(select dm.name from defaultdb.department_master dm where dm.id = vm.departmentId) as departmentName,
	(select u.fullName from users u where u.id = vm.createdBy) as createdBy,
	(select u.fullName from users u where u.id = vm.updatedBy) as updatedBy
from
	stockmanagement.vendor_master vm
`;

const getVendorsByDepartmentQuery = `
select
	vm.id,
	vm.name,
	vm.departmentId,
	vm.isActive,
	(select dm.name from defaultdb.department_master dm where dm.id = vm.departmentId) as departmentName,
	(select u.fullName from users u where u.id = vm.createdBy) as createdBy,
	(select u.fullName from users u where u.id = vm.updatedBy) as updatedBy
from
	stockmanagement.vendor_master vm
where vm.departmentId = :departmentId and vm.isActive = 1
`;

const getSuppliesListQuery = `
select
	sm.id,
	sm.name,
	sm.departmentId,
	sm.isActive,
	(select dm.name from defaultdb.department_master dm where dm.id = sm.departmentId) as departmentName,
	(select u.fullName from users u where u.id = sm.createdBy) as createdBy,
	(select u.fullName from users u where u.id = sm.updatedBy) as updatedBy
from
	stockmanagement.supplies_master sm
`;
const getSuppliesByDepartmentQuery = `
select
	sm.id,
	sm.name,
	sm.departmentId,
	sm.isActive,
	(select dm.name from defaultdb.department_master dm where dm.id = sm.departmentId) as departmentName,
	(select u.fullName from users u where u.id = sm.createdBy) as createdBy,
	(select u.fullName from users u where u.id = sm.updatedBy) as updatedBy
from
	stockmanagement.supplies_master sm
where sm.departmentId = :departmentId and sm.isActive = 1
`;

const getReferralListQuery = `
select
	rtm.id,
	rtm.name,
	rtm.isActive,
	(select u.fullName from users u where u.id = rtm.createdBy) as createdBy,
	(select u.fullName from users u where u.id = rtm.updatedBy) as updatedBy,
	rtm.createdAt,
	rtm.updatedAt
from
	defaultdb.referral_type_master rtm
`;

const getCitiesListQuery = `
select
	cm.id,
	cm.name,
	cm.stateId,
	(select sm.name from state_master sm where sm.id = cm.stateId) as stateName,
	cm.isActive,
	(select u.fullName from users u where u.id = cm.createdBy) as createdBy,
	(select u.fullName from users u where u.id = cm.updatedBy) as updatedBy,
	cm.createdAt,
	cm.updatedAt
from
	defaultdb.city_master cm
`;

const getOtDefaultPersonQuery = `SELECT
	opdm.id,
	opdm.branchId,
	opdm.designationId,
	(select opd.name from ot_person_designation_master opd where opd.id = opdm.designationId) as designationName,
	(select bm.name from branch_master bm where bm.id = opdm.branchId) as branchName,
	(
		SELECT
			JSON_ARRAYAGG(
		                    JSON_OBJECT(
		                        'id', opm.id,
		                        'personName', opm.personName
		                    )
		                ) AS personsList
		FROM
			ot_person_master opm
		WHERE
			FIND_IN_SET(opm.id, opdm.personId) > 0
     ) as personsList,
     (select u.fullName from users u where u.id = opdm.createdBy ) as createdBy,
     (select u.fullName from users u where u.id = opdm.updatedBy ) as updatedBy
FROM
	ot_person_default_master opdm`;

module.exports = {
  getAllAppointmentReasonsQuery,
  getAllLabTestGroupQuery,
  getAllLabTestSampleTypesQuery,
  getAllLabTestsQuery,
  getAllScansQuery,
  getAllEmbryologyQuery,
  getAllPharmacyItemsQuery,
  getAllIncidentsQuery,
  getDepartmentsListQuery,
  getVendorsListQuery,
  getVendorsByDepartmentQuery,
  getSuppliesListQuery,
  getSuppliesByDepartmentQuery,
  getReferralListQuery,
  getCitiesListQuery,
  getOtDefaultPersonQuery
};
