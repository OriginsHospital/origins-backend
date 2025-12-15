const getAllPersonsListQuery = `
    select opm.id, opm.personName, opm.designationId, opdm.name, opm.phoneNumber, opm.createdAt , opm.updatedAt  from ot_person_master opm INNER JOIN ot_person_designation_master opdm 
    on opdm.id = opm.designationId ;
`;

const getOtListQuery = `
    select 
    olm.id , 
    olm.branchId, 
    (select bm.branchCode from branch_master bm where bm.id = olm.branchId) as branchName,
    olm.patientName ,
    olm.procedureName ,
    olm.procedureDate,
    olm.time,
    olm.anesthetistId ,
    (select personName from ot_person_master opm where opm.id = olm.anesthetistId) as anesthetistName,
    olm.embryologistId ,
    (select personName from ot_person_master opm where opm.id = olm.embryologistId) as embryologistName,
    olm.otStaff ,
    (
            SELECT 
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', opm.id,
                        'staffName', opm.personName
                    )
                ) AS staffList
            FROM ot_person_master opm 
            WHERE FIND_IN_SET(opm.id, olm.otStaff) > 0
        ) AS staffList,
    olm.surgeonId ,
    (
            SELECT 
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', opm.id,
                        'staffName', opm.personName
                    )
                ) AS staffList
            FROM ot_person_master opm 
            WHERE FIND_IN_SET(opm.id, olm.surgeonId) > 0
        ) AS surgeonList
    from ot_list_master olm
`;

const getInjectionDetailsByDate = `
    select
	ilm.id,
    ilm.patientId as patientId,
	(select pm.patientId from patient_master pm where pm.id = ilm.patientId ) as originsId,
	(select CONCAT(pm.lastName, ' ',COALESCE(pm.firstName,'')) from patient_master pm  where pm.id = ilm.patientId) as patientName,
	(select COALESCE(pm.firstName,'') from patient_master pm  where pm.id = ilm.patientId) as firstName,
    ilm.administeredDate,
	ilm.administeredTime,
	ilm.medicationId,
	(select im.itemName from stockmanagement.item_master im where im.id = ilm.medicationId) as medicationName,
	ilm.dosage ,
	ilm.administeredNurseId,
	(
	select
		opm.personName
	from
		ot_person_master opm
	where
		opm.id = ilm.administeredNurseId) as administeredNurseName
    from
        injection_list_master ilm 
`;

const getAllPersonsListDesignationWiseQuery = `
    select
        opdm.mappingId ,
        GROUP_CONCAT(DISTINCT opdm.name) as name,
        JSON_ARRAYAGG(JSON_OBJECT(
        'id', opm.id,
        'personName', opm.personName ,
        'designation', opdm.name
    )) as personList
    from
        ot_person_master opm
    INNER JOIN ot_person_designation_master opdm on
        opm.designationId = opdm.id
    GROUP by
        opdm.mappingId;
`;

const getInjectionSuggestionListQuery = `
select im.id, im.itemName from stockmanagement.item_master im INNER JOIN stockmanagement.inventory_type_master itm 
ON im.inventoryType  = itm.id WHERE itm.id = 3 and im.itemName  LIKE :itemName

`;

module.exports = {
  getAllPersonsListQuery,
  getOtListQuery,
  getInjectionDetailsByDate,
  getAllPersonsListDesignationWiseQuery,
  getInjectionSuggestionListQuery
};
