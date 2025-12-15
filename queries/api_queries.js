const getStateQuery = `SELECT id,name FROM state_master`;
const getCitiesQuery = `SELECT id, name FROM city_master where stateId=:stateId`;

const getBillTypeValuesQuery = `
SELECT id, name, amount FROM lab_test_master WHERE :billTypeId = 1 
UNION ALL
SELECT id, name, amount FROM scan_master WHERE :billTypeId = 2
UNION ALL
SELECT im.id, im.itemName, COALESCE(ipm.price,0) FROM stockmanagement.item_master im 
LEFT JOIN stockmanagement.item_price_master ipm ON im.id = ipm.itemId WHERE :billTypeId = 3 and im.isActive = 1
UNION ALL
select em.id, em.name, em.amount from embryology_master em where :billTypeId = 4
`;

const getBillTypeValuesByBranchQuery = `
SELECT ltm.id, ltm.name, ltmba.amount FROM lab_test_master ltm  
INNER JOIN lab_test_master_branch_association ltmba ON ltmba.labTestId = ltm.id
WHERE :billTypeId = 1 and ltmba.branchId = :branchId and ltmba.isActive = 1
UNION ALL
SELECT sm.id, sm.name, smba.amount FROM scan_master sm  
INNER JOIN scan_master_branch_association smba ON smba.scanId  = sm.id
WHERE :billTypeId = 2 and smba.branchId = :branchId and smba.isActive = 1
UNION ALL
SELECT im.id, im.itemName as name, 0 as amount FROM stockmanagement.item_master im WHERE im.isActive  = 1 AND :billTypeId = 3 AND EXISTS (
	select 
		* 
	from stockmanagement.grn_items_associations gia  INNER JOIN stockmanagement.grn_master gm on gm.id = gia.grnId
	where gia.itemId  = im.id and gia.isReturned  = 0 and gm.branchId  IN (:branchId) and gia.totalQuantity  > 0  and CAST(NOW() AS DATE) < gia.expiryDate
)
UNION ALL
select em.id, em.name, emba.amount from embryology_master em 
INNER JOIN embryology_master_branch_association emba ON emba.embryologyId  = em.id
where :billTypeId = 4 and emba.branchId = :branchId and emba.isActive = 1
`;

const getDropdownInfo = `
    SELECT 'roles' AS "Type", JSON_ARRAYAGG(JSON_OBJECT('id',rm.id, 'name',rm.name)) AS "List"
    FROM role_master rm
    UNION 
    select 'branches' as "Type", JSON_ARRAYAGG(JSON_OBJECT('id',bm.id, 'name',bm.branchCode)) AS "List"
    from branch_master bm 
    UNION 
    select 'referralTypes' as "Type", JSON_ARRAYAGG(JSON_OBJECT('id',rtm.id, 'name',rtm.name)) AS "List"
    from referral_type_master rtm
    UNION 
    select 'states' as "Type", JSON_ARRAYAGG(JSON_OBJECT('id',sm.id, 'name',sm.name)) AS "List"
    from state_master sm
    UNION 
    select 'visitTypes' as "Type", JSON_ARRAYAGG(JSON_OBJECT('id',vtm.id, 'name',vtm.name)) AS "List"
    from visit_type_master vtm
    UNION 
    select 'packagesChosen' as "Type", JSON_ARRAYAGG(JSON_OBJECT('id',pm.id, 'name',pm.name)) AS "List"
    from package_master pm
    UNION 
    select 'billTypes' as "Type", JSON_ARRAYAGG(JSON_OBJECT('id',lbm.id, 'name',lbm.billType)) AS "List"
    from line_bills_master lbm
    UNION
    select 'otPersonDesignation' as "Type", JSON_ARRAYAGG(JSON_OBJECT('id',opdm.id, 'name',opdm.name)) AS "List"
    from ot_person_designation_master opdm
    UNION
    SELECT 'expenseCategories' as "Type", JSON_ARRAYAGG(JSON_OBJECT('id',ecm.id, 'name',ecm.categoryName)) AS "List"
    from expense_categories_master ecm 
    UNION
    SELECT 'otProcedureList' as "Type", JSON_ARRAYAGG(JSON_OBJECT('id',opm.id, 'name',opm.name)) AS "List"
    from ot_procedure_master opm 
    UNION
    SELECT 'embryologyList' as "Type", JSON_ARRAYAGG(JSON_OBJECT('id',em.id, 'name',em.name,'amount',em.amount)) AS "List"
    from embryology_master em 
    UNION
    SELECT 'patientTypeList' AS "Type", JSON_ARRAYAGG(JSON_OBJECT('id',ptm.id, 'name',ptm.patientType,'description',ptm.description)) AS "List"
    FROM patient_type_master ptm
    UNION 
    SELECT 'labTestGroupList' AS "Type", JSON_ARRAYAGG(JSON_OBJECT('id',ltgm.id, 'name',ltgm.name)) AS "List"
    FROM lab_test_group_master ltgm where ltgm.isActive = 1
    UNION 
    SELECT 'labTestSampleTypeList' AS "Type", JSON_ARRAYAGG(JSON_OBJECT('id',ltstm.id, 'name',ltstm.name)) AS "List"
    FROM lab_test_sample_type_master ltstm where ltstm.isActive = 1
    UNION
    SELECT 'taxCategoryList' AS "Type", JSON_ARRAYAGG(JSON_OBJECT('id',tcm.id, 'name',tcm.categoryName )) AS "List"
    FROM stockmanagement.tax_category_master tcm
    UNION
    SELECT 'inventoryTypeList' AS "Type", JSON_ARRAYAGG(JSON_OBJECT('id',itm.id, 'name',itm.name)) AS "List"
    FROM stockmanagement.inventory_type_master itm
    UNION
    SELECT 'manufacturerList' AS "Type", JSON_ARRAYAGG(JSON_OBJECT('id',mm.id, 'name',mm.manufacturer )) AS "List"
    FROM stockmanagement.manufacturer_master mm 
    UNION
    SELECT 'departmentList' AS "Type", JSON_ARRAYAGG(JSON_OBJECT('id',dm.id, 'name',dm.name )) AS "List"
    FROM department_master dm 
    UNION
    SELECT 'vendorList' AS "Type", JSON_ARRAYAGG(JSON_OBJECT('id',vm.id, 'name',vm.name )) AS "List"
    FROM stockmanagement.vendor_master vm 
    UNION
    SELECT 'suppliesList' AS "Type", JSON_ARRAYAGG(JSON_OBJECT('id',sm.id, 'name',sm.name )) AS "List"
    FROM stockmanagement.supplies_master sm
    UNION
    SELECT 'bloodGroupList' AS "Type", JSON_ARRAYAGG(JSON_OBJECT('id',bgm.id, 'name',bgm.bloodGroup  )) AS "List"
    FROM blood_group_master bgm where bgm.isActive = 1
    UNION
    SELECT 'consultantTypeList'  AS "Type", JSON_ARRAYAGG(JSON_OBJECT('id',ctm.id, 'name',ctm.name  )) AS "List"
    FROM consultant_type_master ctm where ctm.isActive = 1 
`;

const getAllCitiesQuery = `
SELECT id, name FROM city_master`;

module.exports = {
  getStateQuery,
  getCitiesQuery,
  getBillTypeValuesQuery,
  getBillTypeValuesByBranchQuery,
  getDropdownInfo,
  getAllCitiesQuery
};
