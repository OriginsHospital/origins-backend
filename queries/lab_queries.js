const getLabtestsByDateQuery = `WITH getLabsByDate AS (SELECT 
CASE 
    WHEN calba.isSpouse = 0 THEN CONCAT(pm.lastName, ' ', COALESCE(pm.firstName,''))
    ELSE COALESCE(pga.name,'')
END AS patientName,
CASE 
    WHEN calba.isSpouse = 0 THEN COALESCE(pm.firstName, '')
    ELSE COALESCE(pga.name,'')
END AS firstName,
pm.photoPath as patientPhoto,
calba.isSpouse,
caa.branchId ,
calba.appointmentId as appointmentId,
'CONSULTATION' as type,
JSON_ARRAYAGG(
    JSON_OBJECT(
        'labTestId', ltm.id,
        'name', ltm.name,
        'labTestCategory', CASE WHEN ltmba.isOutSourced = 1 THEN 1 ELSE 0 END,
        'serviceGroup', (SELECT ltgm.name FROM lab_test_group_master ltgm WHERE ltgm.id = ltmba.labTestGroupId),
        'labTestType', (SELECT ltstm.name FROM lab_test_sample_type_master ltstm WHERE ltstm.id = ltmba.sampleTypeId),
        'status', CASE 
            WHEN (SELECT COUNT(*) FROM lab_test_results ltr WHERE ltr.appointmentId = calba.appointmentId
                AND ltr.labTestId = ltm.id AND type = 'CONSULTATION' AND ltr.isSpouse=calba.isSpouse AND ltr.labTestStatus = 2) > 0 THEN 'GREEN'
        WHEN (SELECT COUNT(*) FROM lab_test_results ltr WHERE ltr.appointmentId = calba.appointmentId
                AND ltr.labTestId = ltm.id AND type = 'CONSULTATION' AND ltr.isSpouse=calba.isSpouse AND ltr.labTestStatus = 1) > 0 THEN 'ORANGE'
        ELSE 'RED'
        END   
    )
) AS labTests
FROM consultation_appointment_line_bills_associations calba
INNER JOIN consultation_appointments_associations caa ON caa.id = calba.appointmentId
INNER JOIN visit_consultations_associations vca ON caa.consultationId = vca.id
INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
INNER JOIN patient_master pm ON pm.id = pva.patientId
LEFT JOIN patient_guardian_associations pga on pm.id = pga.patientId 
INNER JOIN lab_test_master ltm ON ltm.id = calba.billTypeValue
INNER JOIN lab_test_master_branch_association ltmba ON ltmba.labTestId = ltm.id AND ltmba.branchId = caa.branchId
WHERE caa.appointmentDate = :appointmentDate AND calba.status = 'PAID' AND calba.billTypeId = 1
    AND (:labCategoryType IS NULL OR ltmba.isOutSourced = :labCategoryType)
GROUP BY pva.patientId, patientName, calba.appointmentId

UNION ALL

SELECT 
    CASE 
        WHEN talba.isSpouse = 0 THEN CONCAT(pm.lastName, ' ', COALESCE(pm.firstName,''))
        ELSE COALESCE(pga.name,'')
    END AS patientName,
    CASE 
        WHEN talba.isSpouse = 0 THEN COALESCE(pm.firstName, '')
        ELSE COALESCE(pga.name,'')
    END AS firstName,
    pm.photoPath AS patientPhoto,
    talba.isSpouse,
    taa.branchId,
    talba.appointmentId AS appointmentId,
    'TREATMENT' AS type,
    JSON_ARRAYAGG(
    JSON_OBJECT(
        'labTestId', ltm.id,
        'name', ltm.name,
        'labTestCategory', CASE WHEN ltmba.isOutSourced = 1 THEN 1 ELSE 0 END,
        'serviceGroup', (SELECT ltgm.name FROM lab_test_group_master ltgm WHERE ltgm.id = ltmba.labTestGroupId),
        'labTestType', (SELECT ltstm.name FROM lab_test_sample_type_master ltstm WHERE ltstm.id = ltmba.sampleTypeId),
        'status', CASE 
        WHEN (SELECT COUNT(*) FROM lab_test_results ltr WHERE ltr.appointmentId = talba.appointmentId
                AND ltr.labTestId = ltm.id AND type = 'TREATMENT' AND ltr.isSpouse=talba.isSpouse AND ltr.labTestStatus = 2) > 0 THEN 'GREEN'
        WHEN (SELECT COUNT(*) FROM lab_test_results ltr WHERE ltr.appointmentId = talba.appointmentId
                AND ltr.labTestId = ltm.id AND type = 'TREATMENT' AND ltr.isSpouse=talba.isSpouse AND ltr.labTestStatus = 1) > 0 THEN 'ORANGE'
        ELSE 'RED'
        END
    )
    ) AS labTests
FROM treatment_appointment_line_bills_associations talba
INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId
INNER JOIN visit_treatment_cycles_associations vtca ON taa.treatmentCycleId = vtca.id
INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
INNER JOIN patient_master pm ON pm.id = pva.patientId
LEFT JOIN patient_guardian_associations pga on pm.id = pga.patientId 
INNER JOIN lab_test_master ltm ON ltm.id = talba.billTypeValue
INNER JOIN lab_test_master_branch_association ltmba ON ltmba.labTestId = ltm.id AND ltmba.branchId = taa.branchId
WHERE taa.appointmentDate = :appointmentDate AND talba.status = 'PAID' AND talba.billTypeId = 1
    AND (:labCategoryType IS NULL OR ltmba.isOutSourced = :labCategoryType)
GROUP BY pva.patientId, patientName, talba.appointmentId
)
SELECT * FROM getLabsByDate
WHERE (:branchId IS NULL OR branchId = :branchId);
`;

const getAllLabTestsQuery = `
WITH Labs AS (
    SELECT 
        CONCAT(pm.lastName, ' ', pm.firstName) AS patientName,
        COALESCE(pm.firstName, '') AS firstName,
        pm.photoPath AS patientPhoto,
        caa.branchId,
        calba.isSpouse,
        caa.appointmentDate,
        calba.appointmentId AS appointmentId,
        'CONSULTATION' AS type,
        ltm.id AS labTestId,
        ltm.name AS labTestName,
        CASE WHEN ltmba.isOutSourced = 1 THEN 1 ELSE 0 END AS labTestCategory,
        (SELECT ltgm.name FROM lab_test_group_master ltgm WHERE ltgm.id = ltmba.labTestGroupId) AS serviceGroup,
        (SELECT ltstm.name FROM lab_test_sample_type_master ltstm WHERE ltstm.id = ltmba.sampleTypeId) AS labTestType,
        CASE 
            WHEN (SELECT COUNT(*) FROM lab_test_results ltr 
                  WHERE ltr.appointmentId = calba.appointmentId
                  AND ltr.labTestId = ltm.id 
                  AND ltr.type = 'CONSULTATION'
                  AND ltr.isSpouse= calba.isSpouse
                  AND ltr.labTestStatus = 2) > 0 THEN 'GREEN'
            WHEN (SELECT COUNT(*) FROM lab_test_results ltr 
                  WHERE ltr.appointmentId = calba.appointmentId
                  AND ltr.labTestId = ltm.id 
                  AND ltr.type = 'CONSULTATION'
                  AND ltr.isSpouse= calba.isSpouse
                  AND ltr.labTestStatus = 1) > 0 THEN 'ORANGE'
            ELSE 'RED'
        END AS status
    FROM consultation_appointment_line_bills_associations calba
    INNER JOIN consultation_appointments_associations caa ON caa.id = calba.appointmentId
    INNER JOIN visit_consultations_associations vca ON caa.consultationId = vca.id
    INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
    INNER JOIN patient_master pm ON pm.id = pva.patientId
    INNER JOIN lab_test_master ltm ON ltm.id = calba.billTypeValue
    INNER JOIN lab_test_master_branch_association ltmba ON ltmba.labTestId = ltm.id AND ltmba.branchId = caa.branchId
    WHERE calba.status = 'PAID' AND calba.billTypeId = 1 AND ltmba.isOutSourced = 0 

    UNION ALL

    SELECT 
        CONCAT(pm.lastName, ' ', pm.firstName) AS patientName,
        COALESCE(pm.firstName, '') AS firstName,
        pm.photoPath AS patientPhoto,
        taa.branchId,
        talba.isSpouse,
        taa.appointmentDate,
        talba.appointmentId AS appointmentId,
        'TREATMENT' AS type,
        ltm.id AS labTestId,
        ltm.name AS labTestName,
        CASE WHEN ltmba.isOutSourced = 1 THEN 1 ELSE 0 END AS labTestCategory,
        (SELECT ltgm.name FROM lab_test_group_master ltgm WHERE ltgm.id = ltmba.labTestGroupId) AS serviceGroup,
        (SELECT ltstm.name FROM lab_test_sample_type_master ltstm WHERE ltstm.id = ltmba.sampleTypeId) AS labTestType,
        CASE 
            WHEN (SELECT COUNT(*) FROM lab_test_results ltr 
                  WHERE ltr.appointmentId = talba.appointmentId
                  AND ltr.labTestId = ltm.id 
                  AND ltr.type = 'TREATMENT' 
                  AND ltr.isSpouse= talba.isSpouse
                  AND ltr.labTestStatus = 2) > 0 THEN 'GREEN'
            WHEN (SELECT COUNT(*) FROM lab_test_results ltr 
                  WHERE ltr.appointmentId = talba.appointmentId
                  AND ltr.labTestId = ltm.id 
                  AND ltr.type = 'TREATMENT' 
                  AND ltr.isSpouse= talba.isSpouse
                  AND ltr.labTestStatus = 1) > 0 THEN 'ORANGE'
            ELSE 'RED'
        END AS status
    FROM treatment_appointment_line_bills_associations talba
    INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId
    INNER JOIN visit_treatment_cycles_associations vtca ON taa.treatmentCycleId = vtca.id
    INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
    INNER JOIN patient_master pm ON pm.id = pva.patientId
    INNER JOIN lab_test_master ltm ON ltm.id = talba.billTypeValue
    INNER JOIN lab_test_master_branch_association ltmba ON ltmba.labTestId = ltm.id AND ltmba.branchId = taa.branchId
    WHERE talba.status = 'PAID' AND talba.billTypeId = 1 AND ltmba.isOutSourced = 0
)SELECT * FROM Labs where 
DATE(appointmentDate) BETWEEN :fromDate AND :toDate 
AND (:branchId IS NULL OR branchId = :branchId) 
ORDER BY appointmentDate DESC ;
`;

const getAllOutsourcingLabtestsQuery = `
WITH OutsourcingLabs AS (
    SELECT 
        CONCAT(pm.lastName, ' ', pm.firstName) AS patientName,
        COALESCE(pm.firstName, '') AS firstName,
        pm.photoPath AS patientPhoto,
        caa.branchId,
        calba.isSpouse,
        caa.appointmentDate,
        calba.appointmentId AS appointmentId,
        'CONSULTATION' AS type,
        ltm.id AS labTestId,
        ltm.name AS labTestName,
        CASE WHEN ltmba.isOutSourced = 1 THEN 1 ELSE 0 END AS labTestCategory,
        (SELECT ltgm.name FROM lab_test_group_master ltgm WHERE ltgm.id = ltmba.labTestGroupId) AS serviceGroup,
        (SELECT ltstm.name FROM lab_test_sample_type_master ltstm WHERE ltstm.id = ltmba.sampleTypeId) AS labTestType,
        CASE 
            WHEN (SELECT COUNT(*) FROM lab_test_results ltr 
                  WHERE ltr.appointmentId = calba.appointmentId
                  AND ltr.labTestId = ltm.id 
                  AND ltr.type = 'CONSULTATION' 
                  AND ltr.isSpouse = calba.isSpouse
                  AND ltr.labTestStatus = 2) > 0 THEN 'GREEN'
            WHEN (SELECT COUNT(*) FROM lab_test_results ltr 
                  WHERE ltr.appointmentId = calba.appointmentId
                  AND ltr.labTestId = ltm.id 
                  AND ltr.type = 'CONSULTATION' 
                  AND ltr.isSpouse = calba.isSpouse
                  AND ltr.labTestStatus = 1) > 0 THEN 'ORANGE'
            ELSE 'RED'
        END AS status
    FROM consultation_appointment_line_bills_associations calba
    INNER JOIN consultation_appointments_associations caa ON caa.id = calba.appointmentId
    INNER JOIN visit_consultations_associations vca ON caa.consultationId = vca.id
    INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
    INNER JOIN patient_master pm ON pm.id = pva.patientId
    INNER JOIN lab_test_master ltm ON ltm.id = calba.billTypeValue
    INNER JOIN lab_test_master_branch_association ltmba ON ltmba.labTestId = ltm.id AND ltmba.branchId = caa.branchId
    WHERE calba.status = 'PAID' AND calba.billTypeId = 1 AND ltmba.isOutSourced = 1

    UNION ALL

    SELECT 
        CONCAT(pm.lastName, ' ', pm.firstName) AS patientName,
        COALESCE(pm.firstName, '') AS firstName,
        pm.photoPath AS patientPhoto,
        taa.branchId,
        talba.isSpouse,
        taa.appointmentDate,
        talba.appointmentId AS appointmentId,
        'TREATMENT' AS type,
        ltm.id AS labTestId,
        ltm.name AS labTestName,
        CASE WHEN ltmba.isOutSourced = 1 THEN 1 ELSE 0 END AS labTestCategory,
        (SELECT ltgm.name FROM lab_test_group_master ltgm WHERE ltgm.id = ltmba.labTestGroupId) AS serviceGroup,
        (SELECT ltstm.name FROM lab_test_sample_type_master ltstm WHERE ltstm.id = ltmba.sampleTypeId) AS labTestType,
        CASE 
            WHEN (SELECT COUNT(*) FROM lab_test_results ltr 
                  WHERE ltr.appointmentId = talba.appointmentId
                  AND ltr.labTestId = ltm.id 
                  AND ltr.type = 'TREATMENT' 
                  AND ltr.isSpouse = talba.isSpouse
                  AND ltr.labTestStatus = 2) > 0 THEN 'GREEN'
            WHEN (SELECT COUNT(*) FROM lab_test_results ltr 
                  WHERE ltr.appointmentId = talba.appointmentId
                  AND ltr.labTestId = ltm.id 
                  AND ltr.type = 'TREATMENT' 
                  AND ltr.isSpouse = talba.isSpouse
                  AND ltr.labTestStatus = 1) > 0 THEN 'ORANGE'
            ELSE 'RED'
        END AS status
    FROM treatment_appointment_line_bills_associations talba
    INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId
    INNER JOIN visit_treatment_cycles_associations vtca ON taa.treatmentCycleId = vtca.id
    INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
    INNER JOIN patient_master pm ON pm.id = pva.patientId
    INNER JOIN lab_test_master ltm ON ltm.id = talba.billTypeValue
    INNER JOIN lab_test_master_branch_association ltmba ON ltmba.labTestId = ltm.id AND ltmba.branchId = taa.branchId
    WHERE talba.status = 'PAID' AND talba.billTypeId = 1 AND ltmba.isOutSourced = 1
)SELECT * FROM OutsourcingLabs 
`;

const getPatientInfoForTemplate = `
SELECT
pm.patientId,
CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) as patientName,
(
select
    name
from
    consultation_doctor_master cdm
where
    cdm.userId = caa.consultationDoctorId) as doctorName,
(YEAR(NOW()) - YEAR(pm.dateOfBirth)) as age,
pm.gender,
COALESCE((select pga.name from patient_guardian_associations pga where pga.patientId = pva.patientId),'') as spouseName,
COALESCE((select pga.age from patient_guardian_associations pga where pga.patientId = pva.patientId),'') as spouseAge
from consultation_appointments_associations caa 
INNER JOIN visit_consultations_associations vca on vca.id = caa.consultationId 
INNER JOIN patient_visits_association pva ON pva.id  = vca.visitId 
INNER JOIN patient_master pm on pm.id = pva.patientId 
WHERE :type = 'consultation' and caa.id = :appointmentId 
UNION ALL
SELECT
pm.patientId,
CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) as patientName,
(
select
    name
from
    consultation_doctor_master cdm
where
    cdm.userId = taa.consultationDoctorId) as doctorName,
(YEAR(NOW()) - YEAR(pm.dateOfBirth)) as age,
pm.gender,
COALESCE((select pga.name from patient_guardian_associations pga where pga.patientId = pva.patientId),'') as spouseName,
COALESCE((select pga.age from patient_guardian_associations pga where pga.patientId = pva.patientId),'') as spouseAge
from treatment_appointments_associations taa
INNER JOIN visit_treatment_cycles_associations vtca on vtca.id = taa.treatmentCycleId 
INNER JOIN patient_visits_association pva ON pva.id  = vtca.visitId 
INNER JOIN patient_master pm on pm.id = pva.patientId 
WHERE :type = 'treatment' and taa.id = :appointmentId
`;

const getLabHeaderInformation = `
    SELECT
	JSON_OBJECT(
		'patientId', pm.patientId,
		'age', CASE 
			WHEN calba.isSpouse = 0 THEN YEAR(NOW()) - YEAR(pm.dateOfBirth)
			ELSE pga.age
		END,
		'gender', CASE 
			WHEN calba.isSpouse = 0 THEN pm.gender
			ELSE COALESCE(pga.gender,'')
		END,
		'sampleType', (
			SELECT ltstm.name 
			FROM lab_test_master_branch_association ltmba
			INNER JOIN lab_test_sample_type_master ltstm ON ltmba.sampleTypeId = ltstm.id
			WHERE ltmba.labTestId = calba.billTypeValue AND ltmba.branchId = caa.branchId
			LIMIT 1
		),
		'requestDate', DATE_FORMAT(calba.createdAt, '%d-%m-%Y %h:%i %p'),
		'sampleCollectionOn', COALESCE((
			SELECT DATE_FORMAT(ltr.sampleCollectedOn, '%d-%m-%Y %h:%i %p')
			FROM lab_test_results ltr 
			WHERE ltr.type = 'CONSULTATION' 
			AND ltr.appointmentId = caa.id 
			AND ltr.labTestId = :labTestId
			AND ltr.isSpouse = :isSpouse
		), ''),
		'patientName', CASE 
			WHEN calba.isSpouse = 0 THEN CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, ''))
			ELSE COALESCE(pga.name, '')
		END,
		'doctorName', (
			SELECT cdm.name 
			FROM consultation_doctor_master cdm 
			WHERE cdm.userId = caa.consultationDoctorId
		)
	) AS patientInformation
FROM consultation_appointment_line_bills_associations calba
INNER JOIN consultation_appointments_associations caa ON caa.id = calba.appointmentId
INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
INNER JOIN patient_master pm ON pm.id = pva.patientId
LEFT JOIN patient_guardian_associations pga ON pm.id = pga.patientId
WHERE
	caa.id = :appointmentId 
	AND :type = 'consultation'
	AND calba.billTypeValue = :labTestId 
	AND calba.billTypeId = 1
	AND calba.isSpouse = :isSpouse

UNION ALL

SELECT
	JSON_OBJECT(
		'patientId', pm.patientId,
		'age', CASE 
			WHEN talba.isSpouse = 0 THEN YEAR(NOW()) - YEAR(pm.dateOfBirth)
			ELSE pga.age
		END,
		'gender', CASE 
			WHEN talba.isSpouse = 0 THEN pm.gender
			ELSE COALESCE(pga.gender,'')
		END,
		'sampleType', (
			SELECT ltstm.name 
			FROM lab_test_master_branch_association ltmba
			INNER JOIN lab_test_sample_type_master ltstm ON ltmba.sampleTypeId = ltstm.id
			WHERE ltmba.labTestId = talba.billTypeValue AND ltmba.branchId = taa.branchId
			LIMIT 1
		),
		'requestDate', DATE_FORMAT(talba.createdAt, '%d-%m-%Y %h:%i %p'),
		'sampleCollectionOn', COALESCE((
			SELECT DATE_FORMAT(ltr.sampleCollectedOn, '%d-%m-%Y %h:%i %p')
			FROM lab_test_results ltr 
			WHERE ltr.type = 'TREATMENT' 
			AND ltr.appointmentId = taa.id
			AND ltr.isSpouse = :isSpouse
			AND ltr.labTestId = :labTestId
		), ''),
		'patientName', CASE 
			WHEN talba.isSpouse = 0 THEN CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, ''))
			ELSE COALESCE(pga.name, '')
		END,
		'doctorName', (
			SELECT cdm.name 
			FROM consultation_doctor_master cdm 
			WHERE cdm.userId = taa.consultationDoctorId
		)
	) AS patientInformation
FROM treatment_appointment_line_bills_associations talba
INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId
INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId
INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
INNER JOIN patient_master pm ON pm.id = pva.patientId
LEFT JOIN patient_guardian_associations pga ON pm.id = pga.patientId
WHERE
	taa.id = :appointmentId
	AND :type = 'treatment'
	AND talba.billTypeValue = :labTestId 
	AND talba.billTypeId = 1
	AND talba.isSpouse =:isSpouse;

`;

module.exports = {
  getLabtestsByDateQuery,
  getAllLabTestsQuery,
  getPatientInfoForTemplate,
  getLabHeaderInformation,
  getAllOutsourcingLabtestsQuery
};
