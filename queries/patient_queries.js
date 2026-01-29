const getDateFilteredPatientsQuery = `SELECT *, DATE_FORMAT(updatedAt, '%d/%m/%Y') AS formattedUpdatedAt
FROM patient_master
WHERE DATE_FORMAT(updatedAt, '%d/%m/%Y') BETWEEN :fromDate AND :toDate`;

const getPatientsQuery = `
select pm.id, patientId,
pm.photoPath ,
pm.branchId,
(SELECT bm.branchCode FROM branch_master bm WHERE bm.id = pm.branchId) AS branch,
CAST(pm.createdAt as DATE) as registeredDate,
JSON_OBJECT('id', patientTypeId, 'name', ptm.patientType) AS patientType,
aadhaarNo,mobileNo,CONCAT(lastName,' ',firstName) as Name, 
dateOfBirth,
JSON_OBJECT('id', cityId, 'name', cm.name) AS city,
JSON_OBJECT('id', referralId, 'referralSource', rtm.name) AS referralSource,
referralName,
(select pva.id from patient_visits_association pva where pva.patientId = pm.id and pva.isActive = 1 LIMIT 1) as activeVisitId,
COALESCE(
    (
        SELECT cdm.name 
        FROM consultation_appointments_associations caa
        INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
        INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
        INNER JOIN consultation_doctor_master cdm ON cdm.userId = caa.consultationDoctorId
        WHERE pva.patientId = pm.id
        ORDER BY caa.appointmentDate DESC, caa.createdAt DESC
        LIMIT 1
    ),
    (
        SELECT cdm.name 
        FROM treatment_appointments_associations taa
        INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId
        INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
        INNER JOIN consultation_doctor_master cdm ON cdm.userId = taa.consultationDoctorId
        WHERE pva.patientId = pm.id
        ORDER BY taa.appointmentDate DESC, taa.createdAt DESC
        LIMIT 1
    )
) AS assignedDoctor
from patient_master pm 
INNER JOIN patient_type_master ptm ON ptm.id = patientTypeId 
INNER JOIN city_master cm ON cm.id = cityId
INNER JOIN referral_type_master rtm ON  rtm.id  = referralId
`;

const getPatientInfoForDischargeSheet = `
SELECT
	CONCAT(pm.lastName, ' ', COALESCE(pm.firstName,'')) as patientName,
	COALESCE(pga.name,'') as husbandName,
	CONCAT(YEAR(NOW()) - YEAR(pm.dateOfBirth)) AS patientAge,
	COALESCE(pga.age, '') as husbandAge
from
	visit_treatment_cycles_associations vtca 
LEFT JOIN ot_list_master olm ON
	vtca.id = olm.treatmentCycleId
INNER JOIN patient_visits_association pva ON pva.id  = vtca.visitId 
INNER JOIN patient_master pm on pm.id  = pva.patientId 
LEFT JOIN patient_guardian_associations pga on pga.patientId = pm.id 
WHERE vtca.id  = :treatmentCycleId
`;

const getPatientTreatmentCYclesQuery = `
SELECT 
	(SELECT bm.branchCode FROM branch_master bm WHERE bm.id = pm.branchId) AS branch,
	pm.patientId AS patientId, 
    CONCAT(pm.lastName, ' ', pm.firstName) AS patientName,
    COALESCE(pm.firstName,'') as firstName,
    pva.id AS visitId,
    vtca.treatmentTypeId as treatmentTypeId,
    (select ttm.treatmentCode  from treatment_type_master ttm where ttm.id = vtca.treatmentTypeId) as treatmentName,
    
    CASE 
        WHEN vpa.registrationAmount = 0 THEN '-'
        WHEN vpa.registrationDate IS NULL THEN 'Pending'
        ELSE DATE_FORMAT(vpa.registrationDate, '%d-%m-%Y')
    END AS registrationDate,

    CASE 
        WHEN vpa.day1Amount = 0 THEN '-'
        WHEN vpa.day1Date IS NULL THEN 'Pending'
        ELSE DATE_FORMAT(vpa.day1Date, '%d-%m-%Y')
    END AS day1Date,
    
    CASE 
        WHEN vtca.treatmentTypeId IN (4, 5) THEN
            CASE 
                WHEN vpa.day1Amount = 0 THEN '-'
                WHEN vpa.day1Date IS NULL THEN 'Pending'
                ELSE DATE_FORMAT(vpa.day1Date, '%d-%m-%Y')
            END
        ELSE '-'
    END AS icsiD1,

    CASE 
        WHEN vpa.pickUpAmount = 0 THEN '-'
        WHEN vpa.pickUpDate IS NULL THEN 'Pending'
        ELSE DATE_FORMAT(vpa.pickUpDate, '%d-%m-%Y')
    END AS pickUpDate,

    CASE 
        WHEN vpa.hysteroscopyAmount = 0 THEN '-'
        WHEN vpa.hysteroscopyDate IS NULL THEN 'Pending'
        ELSE DATE_FORMAT(vpa.hysteroscopyDate, '%d-%m-%Y')
    END AS hysteroscopyDate,

    CASE 
        WHEN vpa.day5FreezingAmount = 0 THEN '-'
        WHEN vpa.day5FreezingDate IS NULL THEN 'Pending'
        ELSE DATE_FORMAT(vpa.day5FreezingDate, '%d-%m-%Y')
    END AS day5FreezingDate,

    CASE 
        WHEN vpa.fetAmount = 0 THEN '-'
        WHEN vpa.fetDate IS NULL THEN 'Pending'
        ELSE DATE_FORMAT(vpa.fetDate, '%d-%m-%Y')
    END AS fetDate,

    CASE 
        WHEN vpa.eraAmount = 0 THEN '-'
        WHEN vpa.eraDate IS NULL THEN 'Pending'
        ELSE DATE_FORMAT(vpa.eraDate, '%d-%m-%Y')
    END AS eraDate,

    CASE 
        WHEN vpa.uptPositiveAmount = 0 THEN '-'
        WHEN vpa.uptPositiveDate IS NULL THEN 'Pending'
        ELSE DATE_FORMAT(vpa.uptPositiveDate, '%d-%m-%Y')
    END AS uptPositiveDate

FROM patient_master pm
INNER JOIN patient_visits_association pva ON pva.patientId = pm.id 
INNER JOIN visit_packages_associations vpa ON vpa.visitId = pva.id
INNER JOIN visit_treatment_cycles_associations vtca ON vtca.visitId  = pva.id
WHERE pva.isActive = 1
`;

const getPatientDetailsForOpdSheetQuery = `
select 
	JSON_OBJECT(
		'date', CURRENT_DATE(),
		'patientId', pm.patientId,
		'patientName', CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')),
		'age', (YEAR(NOW()) - YEAR(pm.dateOfBirth)),
		'maritalStatus', COALESCE(pm.maritalStatus,''),
		'height', COALESCE(v.height,''),
		'weight', COALESCE(v.weight,''),
		'bmi', COALESCE(v.bmi,''),
		'spouseBmiInformation', CONCAT(COALESCE(vs.spouseHeight, ''), ' ', COALESCE(vs.spouseWeight, ''), ' ', COALESCE(vs.spouseBmi, '')),
        'spouseName', COALESCE((select pga.Name from patient_guardian_associations pga where pga.patientId = :patientId),'')
	) as patientDetails
from patient_master pm 
LEFT JOIN (
	SELECT
		vaa.*
	from
		vitals_appointments_associations vaa
	where vaa.appointmentDate = (
	        SELECT MAX(v2.appointmentDate) 
	        FROM vitals_appointments_associations v2 
	        WHERE v2.patientId = vaa.patientId
    	)
) v ON v.patientId = (select pm.patientId from patient_master pm  where pm.id = :patientId)
LEFT JOIN (
	SELECT
		vaa.*
	from
		vitals_appointments_associations vaa
	where vaa.appointmentDate = (
	        SELECT MAX(v2.appointmentDate) 
	        FROM vitals_appointments_associations v2
	        WHERE v2.patientId = vaa.patientId and (v2.spouseHeight  <> null or v2.spouseHeight <> '' or v2.spouseWeight <> null or v2.spouseWeight <> '')
    	)
) vs ON vs.patientId = (select pm.patientId from patient_master pm  where pm.id = :patientId)
WHERE pm.id = :patientId
`;

const searchPatientByAadhaarQuery = `
select
	pm.*
from
	patient_master pm
LEFT JOIN patient_guardian_associations pga on
	pga.patientId = pm.id
where
	pm.aadhaarNo = :aadhaarNo or pga.aadhaarNo = :aadhaarNo
`;
module.exports = {
  getDateFilteredPatientsQuery,
  getPatientsQuery,
  getPatientInfoForDischargeSheet,
  getPatientTreatmentCYclesQuery,
  getPatientDetailsForOpdSheetQuery,
  searchPatientByAadhaarQuery
};
