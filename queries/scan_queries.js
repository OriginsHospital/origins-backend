const getScansByDateQuery = `WITH getScansByDate as (SELECT 
CONCAT(pm.lastName, ' ', pm.firstName) as patientName,
COALESCE(pm.firstName,'') as firstName,
caa.branchId ,
pm.photoPath as patientPhoto,
calba.appointmentId as appointmentId,
'CONSULTATION' as type,
JSON_ARRAYAGG(
    JSON_OBJECT(
        'scanId', sm.id,
        'name', sm.name,
        'amount', smba.amount,
        'isformFRequired', smba.isFormFRequired,
        'isReviewed',(select psfa.isReviewed from patient_scan_formf_associations psfa where psfa.appointmentId = calba.appointmentId and psfa.type = 'Consultation' and psfa.scanId = sm.id LIMIT 1),
        'stage', CASE 
            WHEN (SELECT COUNT(*) FROM scan_results sr  WHERE sr.appointmentId = calba.appointmentId
                  AND sr.scanId = sm.id AND type = 'CONSULTATION' AND sr.scanTestStatus = 2
            ) > 0 THEN 'GREEN'
            WHEN (SELECT COUNT(*) FROM scan_results sr  WHERE sr.appointmentId = calba.appointmentId
                  AND sr.scanId = sm.id AND type = 'CONSULTATION' AND sr.scanTestStatus = 1
            ) > 0 THEN 'ORANGE'
            ELSE 'ORANGE'
        END   
    )
) AS scanTests
FROM consultation_appointment_line_bills_associations calba
INNER JOIN consultation_appointments_associations caa ON caa.id = calba.appointmentId
INNER JOIN visit_consultations_associations vca ON caa.consultationId = vca.id
INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
INNER JOIN patient_master pm ON pm.id = pva.patientId
INNER JOIN scan_master sm  ON sm.id = calba.billTypeValue
INNER JOIN scan_master_branch_association smba ON smba.scanId = sm.id
WHERE caa.appointmentDate = :appointmentDate AND calba.status = 'PAID' and calba.billTypeId = 2 and smba.branchId = caa.branchId
GROUP BY pva.patientId, patientName, calba.appointmentId

UNION ALL

SELECT 
CONCAT(pm.lastName, ' ', pm.firstName) as patientName,
COALESCE(pm.firstName,'') as firstName,
taa.branchId ,
pm.photoPath as patientPhoto,
talba.appointmentId as appointmentId,
'TREATMENT' as type,
JSON_ARRAYAGG(
    JSON_OBJECT(
        'scanId', sm.id,
        'name', sm.name,
        'amount', smba.amount,
        'isformFRequired', smba.isFormFRequired,
        'isReviewed',(select psfa.isReviewed from patient_scan_formf_associations psfa where psfa.appointmentId = talba.appointmentId and psfa.type = 'Treatment' and psfa.scanId = sm.id LIMIT 1),
        'stage', CASE 
            WHEN (SELECT COUNT(*) FROM scan_results sr  WHERE sr.appointmentId = talba.appointmentId
                  AND sr.scanId = sm.id AND type = 'TREATMENT' AND sr.scanTestStatus = 2
            ) > 0 THEN 'GREEN'
            WHEN (SELECT COUNT(*) FROM scan_results sr  WHERE sr.appointmentId = talba.appointmentId
                  AND sr.scanId = sm.id AND type = 'TREATMENT' AND sr.scanTestStatus = 1
            ) > 0 THEN 'ORANGE'
            ELSE 'ORANGE'
        END   
    )
) AS scanTests
FROM treatment_appointment_line_bills_associations talba
INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId
INNER JOIN visit_treatment_cycles_associations vtca ON taa.treatmentCycleId = vtca.id
INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
INNER JOIN patient_master pm ON pm.id = pva.patientId
INNER JOIN scan_master sm ON sm.id = talba.billTypeValue
INNER JOIN scan_master_branch_association smba ON smba.scanId = sm.id
WHERE taa.appointmentDate = :appointmentDate AND talba.status = 'PAID' and talba.billTypeId = 2 and smba.branchId = taa.branchId
GROUP BY pva.patientId, patientName, talba.appointmentId
) 
select * from getScansByDate WHERE (:branchId IS NULL OR branchId = :branchId)
`;

const getFormFTemplateByDateRangeQuery = `
SELECT * from (
        SELECT
            pva.patientId,
            "Consultation" as type,
            caa.id as appointmentId,
            caa.appointmentDate as appointmentDate,
            MAX(psfa.createdAt) as maxCreatedDate,
            JSON_OBJECT(
                'patientName', (select CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, ''))
                               from patient_master pm
                               where pm.id = pva.patientId),
                'patientId', (select pm.patientId
                             from patient_master pm
                             where pm.id = pva.patientId),
                'patientAadhaarNo', (select pm.aadhaarNo
                             from patient_master pm
                             where pm.id = pva.patientId)
            ) as patientDetails,
            JSON_OBJECT(
                'appointmentDate', caa.appointmentDate,
                'appointmentReason', (select arm.name
                                    from appointment_reason_master arm
                                    where arm.id = caa.appointmentReasonId),
                'doctorName', (select cdm.name
                              from consultation_doctor_master cdm
                              where cdm.userId = caa.consultationDoctorId)
            ) as appointmentInfo,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                        'formFId',psfa.id,
                        'scanId', psfa.scanId ,
                        'scanName',(select scn.name
                             from scan_master scn
                             where psfa.scanId = scn.id),
                        'isReviewed', psfa.isReviewed ,
                        'uploadLink', psfa.formFUploadLink ,
                        'uploadKey', psfa.formFUploadKey
                )
            ) as formFDetails
        FROM
            patient_scan_formf_associations psfa
            INNER JOIN consultation_appointments_associations caa
                on caa.id = psfa.appointmentId and psfa.type = 'Consultation'
            INNER JOIN visit_consultations_associations vca
                on vca.id = caa.consultationId
            INNER JOIN patient_visits_association pva
                on pva.id = vca.visitId
        GROUP BY
            pva.patientId,
            caa.id,
            caa.appointmentDate
        UNION ALL
        SELECT
            pva.patientId,
            "Treatment" as type,
            taa.id as appointmentId,
            taa.appointmentDate as appointmentDate,
            MAX(psfa.createdAt) as maxCreatedDate,
            JSON_OBJECT(
                'patientName', (select CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, ''))
                               from patient_master pm
                               where pm.id = pva.patientId),
                'patientId', (select pm.patientId
                             from patient_master pm
                             where pm.id = pva.patientId),
                'patientAadhaarNo', (select pm.aadhaarNo
                             from patient_master pm
                             where pm.id = pva.patientId)
            ) as patientDetails,
            JSON_OBJECT(
                'appointmentDate', taa.appointmentDate,
                'appointmentReason', (select arm.name
                                    from appointment_reason_master arm
                                    where arm.id = taa.appointmentReasonId),
                'doctorName', (select cdm.name
                              from consultation_doctor_master cdm
                              where cdm.userId = taa.consultationDoctorId)
            ) as appointmentInfo,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                        'formFId',psfa.id,
                        'scanId', psfa.scanId ,
                        'scanName',(select scn.name
                             from scan_master scn
                             where psfa.scanId = scn.id),
                        'isReviewed', psfa.isReviewed ,
                        'uploadLink', psfa.formFUploadLink ,
                        'uploadKey', psfa.formFUploadKey ,
                        'sampleTemplate', psfa.formFTemplate
                )
            ) as formFDetails
        FROM
            patient_scan_formf_associations psfa
            INNER JOIN treatment_appointments_associations taa
                on taa.id = psfa.appointmentId and psfa.type = 'Treatment'
            INNER JOIN visit_treatment_cycles_associations vtca
                on vtca.id = taa.treatmentCycleId
            INNER JOIN patient_visits_association pva
                on pva.id = vtca.visitId
        GROUP BY
            pva.patientId,
            taa.id,
            taa.appointmentDate
) as formFList where CAST(maxCreatedDate AS DATE) BETWEEN :fromDate AND :toDate order by maxCreatedDate desc;
`;

const getScanHeaderInformation = `
select JSON_OBJECT(
    'patientName',CASE 
	        WHEN calba.isSpouse = 0 THEN CONCAT(pm.lastName, ' ', COALESCE(pm.firstName,''))
	        ELSE COALESCE(pga.name,'')
	 END,   
	'mobileNumber',pm.mobileNo ,
	'requestDateTime',DATE_FORMAT(NOW(), '%d-%m-%Y %h:%i %p'),
	'patientId',pm.patientId ,
    'age', CASE 
	        WHEN calba.isSpouse = 0 THEN YEAR(NOW()) - YEAR(pm.dateOfBirth)
	        ELSE pga.age
	END,
	'gender', CASE 
	        WHEN calba.isSpouse = 0 THEN pm.gender
	        ELSE COALESCE(pga.gender,'')
	END,
	'doctorName',(select cdm.name from consultation_doctor_master cdm where cdm.userId = caa.consultationDoctorId),
	'printDate', DATE_FORMAT(NOW(), '%d-%m-%Y %h:%i %p')
) as patientInformation from consultation_appointment_line_bills_associations calba
INNER JOIN consultation_appointments_associations caa 
on caa.id = calba.appointmentId
INNER JOIN visit_consultations_associations vca on vca.id = caa.consultationId 
INNER JOIN patient_visits_association pva on pva.id  = vca.visitId 
INNER JOIN patient_master pm on pm.id = pva.patientId 
LEFT JOIN patient_guardian_associations pga on pm.id = pga.patientId 
where caa.id = :appointmentId and :type = 'consultation' 
and calba.billTypeValue  = :scanId and calba.billTypeId  = 2

UNION ALL

select JSON_OBJECT(
	'patientName',CASE 
	        WHEN talba.isSpouse = 0 THEN CONCAT(pm.lastName, ' ', COALESCE(pm.firstName,''))
	        ELSE COALESCE(pga.name,'')
	END, 
	'mobileNumber',pm.mobileNo ,
	'requestDateTime',DATE_FORMAT(NOW(), '%d-%m-%Y %h:%i %p'),
	'patientId',pm.patientId ,
	'age', CASE 
	        WHEN talba.isSpouse = 0 THEN YEAR(NOW()) - YEAR(pm.dateOfBirth)
	        ELSE pga.age
	END,
	'gender', CASE 
	        WHEN talba.isSpouse = 0 THEN pm.gender
	        ELSE COALESCE(pga.gender,'')
	END,
	'doctorName',(select cdm.name from consultation_doctor_master cdm where cdm.userId = taa.consultationDoctorId),
	'printDate', DATE_FORMAT(NOW(), '%d-%m-%Y %h:%i %p')
) as patientInformation from treatment_appointment_line_bills_associations talba 
INNER JOIN treatment_appointments_associations taa 
on taa.id = talba.appointmentId
INNER JOIN visit_treatment_cycles_associations vtca on vtca.id = taa.treatmentCycleId 
INNER JOIN patient_visits_association pva on pva.id  = vtca.visitId 
INNER JOIN patient_master pm on pm.id = pva.patientId 
LEFT JOIN patient_guardian_associations pga on pm.id = pga.patientId 
where taa.id = :appointmentId and :type = 'treatment'
and talba.billTypeValue  = :scanId and talba.billTypeId  = 2
`;

const getScanReportsQuery = `
WITH ScanReports AS (
    SELECT
        CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) AS patientName,
        DATE(caa.appointmentDate) AS reportDate,
        caa.branchId,
        sm.name AS scanName,
        'CONSULTATION' AS scanType,
        CASE
            WHEN (
                SELECT COUNT(*)
                FROM scan_results sr
                WHERE sr.appointmentId = calba.appointmentId
                    AND sr.scanId = sm.id
                    AND sr.type = 'CONSULTATION'
                    AND sr.scanTestStatus = 2
            ) > 0 THEN 'Completed'
            ELSE 'Pending'
        END AS status,
        calba.appointmentId AS appointmentId
    FROM consultation_appointment_line_bills_associations calba
    INNER JOIN consultation_appointments_associations caa ON caa.id = calba.appointmentId
    INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
    INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
    INNER JOIN patient_master pm ON pm.id = pva.patientId
    INNER JOIN scan_master sm ON sm.id = calba.billTypeValue
    INNER JOIN scan_master_branch_association smba
        ON smba.scanId = sm.id AND smba.branchId = caa.branchId
    WHERE
        calba.status = 'PAID'
        AND calba.billTypeId = 2
        AND DATE(caa.appointmentDate) BETWEEN :fromDate AND :toDate
        AND (:branchId IS NULL OR caa.branchId = :branchId)

    UNION ALL

    SELECT
        CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) AS patientName,
        DATE(taa.appointmentDate) AS reportDate,
        taa.branchId,
        sm.name AS scanName,
        'TREATMENT' AS scanType,
        CASE
            WHEN (
                SELECT COUNT(*)
                FROM scan_results sr
                WHERE sr.appointmentId = talba.appointmentId
                    AND sr.scanId = sm.id
                    AND sr.type = 'TREATMENT'
                    AND sr.scanTestStatus = 2
            ) > 0 THEN 'Completed'
            ELSE 'Pending'
        END AS status,
        talba.appointmentId AS appointmentId
    FROM treatment_appointment_line_bills_associations talba
    INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId
    INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId
    INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
    INNER JOIN patient_master pm ON pm.id = pva.patientId
    INNER JOIN scan_master sm ON sm.id = talba.billTypeValue
    INNER JOIN scan_master_branch_association smba
        ON smba.scanId = sm.id AND smba.branchId = taa.branchId
    WHERE
        talba.status = 'PAID'
        AND talba.billTypeId = 2
        AND DATE(taa.appointmentDate) BETWEEN :fromDate AND :toDate
        AND (:branchId IS NULL OR taa.branchId = :branchId)
)
SELECT
    patientName,
    reportDate,
    branchId,
    scanName,
    scanType,
    status,
    appointmentId
FROM ScanReports
ORDER BY reportDate DESC;
`;

/** Prescriptions with line items or notes for patient (isSpouse=0) or spouse (isSpouse=1), consultation and treatment. */
const getPrescriptionsByDateQuery = `
SELECT * FROM (
  SELECT
    caa.id AS appointmentId,
    'Consultation' AS appointmentType,
    CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) AS patientName,
    COALESCE(
      (SELECT pga.name FROM patient_guardian_associations pga WHERE pga.patientId = pm.id LIMIT 1),
      ''
    ) AS spouseName,
    COALESCE(
      (SELECT arm.name FROM appointment_reason_master arm WHERE arm.id = caa.appointmentReasonId),
      ''
    ) AS appointmentReason,
    COALESCE(
      (SELECT cdm.name FROM consultation_doctor_master cdm WHERE cdm.userId = caa.consultationDoctorId),
      ''
    ) AS doctorName,
    caa.branchId,
    0 AS isSpouse,
    'Patient' AS subjectLabel
  FROM consultation_appointments_associations caa
  INNER JOIN visit_consultations_associations vca ON caa.consultationId = vca.id
  INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
  INNER JOIN patient_master pm ON pm.id = pva.patientId
  WHERE DATE(caa.appointmentDate) = DATE(:appointmentDate)
    AND (:branchId IS NULL OR caa.branchId = :branchId)
    AND (
      EXISTS (
        SELECT 1 FROM consultation_appointment_notes_associations cana
        WHERE cana.appointmentId = caa.id AND cana.isSpouse = 0
          AND cana.notes IS NOT NULL AND TRIM(cana.notes) <> ''
      )
      OR EXISTS (
        SELECT 1 FROM consultation_appointment_line_bills_associations calba
        WHERE calba.appointmentId = caa.id AND calba.isSpouse = 0
      )
    )
  UNION ALL
  SELECT
    caa.id AS appointmentId,
    'Consultation' AS appointmentType,
    CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) AS patientName,
    COALESCE(
      (SELECT pga.name FROM patient_guardian_associations pga WHERE pga.patientId = pm.id LIMIT 1),
      ''
    ) AS spouseName,
    COALESCE(
      (SELECT arm.name FROM appointment_reason_master arm WHERE arm.id = caa.appointmentReasonId),
      ''
    ) AS appointmentReason,
    COALESCE(
      (SELECT cdm.name FROM consultation_doctor_master cdm WHERE cdm.userId = caa.consultationDoctorId),
      ''
    ) AS doctorName,
    caa.branchId,
    1 AS isSpouse,
    'Spouse' AS subjectLabel
  FROM consultation_appointments_associations caa
  INNER JOIN visit_consultations_associations vca ON caa.consultationId = vca.id
  INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
  INNER JOIN patient_master pm ON pm.id = pva.patientId
  WHERE DATE(caa.appointmentDate) = DATE(:appointmentDate)
    AND (:branchId IS NULL OR caa.branchId = :branchId)
    AND (
      EXISTS (
        SELECT 1 FROM consultation_appointment_notes_associations cana
        WHERE cana.appointmentId = caa.id AND cana.isSpouse = 1
          AND cana.notes IS NOT NULL AND TRIM(cana.notes) <> ''
      )
      OR EXISTS (
        SELECT 1 FROM consultation_appointment_line_bills_associations calba
        WHERE calba.appointmentId = caa.id AND calba.isSpouse = 1
      )
    )
  UNION ALL
  SELECT
    taa.id AS appointmentId,
    'Treatment' AS appointmentType,
    CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) AS patientName,
    COALESCE(
      (SELECT pga.name FROM patient_guardian_associations pga WHERE pga.patientId = pm.id LIMIT 1),
      ''
    ) AS spouseName,
    COALESCE(
      (SELECT arm.name FROM appointment_reason_master arm WHERE arm.id = taa.appointmentReasonId),
      ''
    ) AS appointmentReason,
    COALESCE(
      (SELECT cdm.name FROM consultation_doctor_master cdm WHERE cdm.userId = taa.consultationDoctorId),
      ''
    ) AS doctorName,
    taa.branchId,
    0 AS isSpouse,
    'Patient' AS subjectLabel
  FROM treatment_appointments_associations taa
  INNER JOIN visit_treatment_cycles_associations vtca ON taa.treatmentCycleId = vtca.id
  INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
  INNER JOIN patient_master pm ON pm.id = pva.patientId
  WHERE DATE(taa.appointmentDate) = DATE(:appointmentDate)
    AND (:branchId IS NULL OR taa.branchId = :branchId)
    AND (
      EXISTS (
        SELECT 1 FROM treatment_appointment_notes_associations tana
        WHERE tana.appointmentId = taa.id AND tana.isSpouse = 0
          AND tana.notes IS NOT NULL AND TRIM(tana.notes) <> ''
      )
      OR EXISTS (
        SELECT 1 FROM treatment_appointment_line_bills_associations talba
        WHERE talba.appointmentId = taa.id AND talba.isSpouse = 0
      )
    )
  UNION ALL
  SELECT
    taa.id AS appointmentId,
    'Treatment' AS appointmentType,
    CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) AS patientName,
    COALESCE(
      (SELECT pga.name FROM patient_guardian_associations pga WHERE pga.patientId = pm.id LIMIT 1),
      ''
    ) AS spouseName,
    COALESCE(
      (SELECT arm.name FROM appointment_reason_master arm WHERE arm.id = taa.appointmentReasonId),
      ''
    ) AS appointmentReason,
    COALESCE(
      (SELECT cdm.name FROM consultation_doctor_master cdm WHERE cdm.userId = taa.consultationDoctorId),
      ''
    ) AS doctorName,
    taa.branchId,
    1 AS isSpouse,
    'Spouse' AS subjectLabel
  FROM treatment_appointments_associations taa
  INNER JOIN visit_treatment_cycles_associations vtca ON taa.treatmentCycleId = vtca.id
  INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
  INNER JOIN patient_master pm ON pm.id = pva.patientId
  WHERE DATE(taa.appointmentDate) = DATE(:appointmentDate)
    AND (:branchId IS NULL OR taa.branchId = :branchId)
    AND (
      EXISTS (
        SELECT 1 FROM treatment_appointment_notes_associations tana
        WHERE tana.appointmentId = taa.id AND tana.isSpouse = 1
          AND tana.notes IS NOT NULL AND TRIM(tana.notes) <> ''
      )
      OR EXISTS (
        SELECT 1 FROM treatment_appointment_line_bills_associations talba
        WHERE talba.appointmentId = taa.id AND talba.isSpouse = 1
      )
    )
) AS prescription_rows
ORDER BY patientName ASC, appointmentType ASC, appointmentId ASC, isSpouse ASC
`;

const getOpuSheetsByDateQuery = `
SELECT
  taa.id AS appointmentId,
  taa.treatmentCycleId,
  'Treatment' AS appointmentType,
  CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) AS patientName,
  COALESCE(
    (SELECT arm.name FROM appointment_reason_master arm WHERE arm.id = taa.appointmentReasonId),
    ''
  ) AS appointmentReason,
  COALESCE(
    (SELECT cdm.name FROM consultation_doctor_master cdm WHERE cdm.userId = taa.consultationDoctorId),
    ''
  ) AS doctorName,
  taa.branchId,
  TIME_FORMAT(taa.timeStart, '%H:%i') AS timeStart,
  TIME_FORMAT(taa.timeEnd, '%H:%i') AS timeEnd
FROM treatment_appointments_associations taa
INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId
INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
INNER JOIN patient_master pm ON pm.id = pva.patientId
WHERE DATE(taa.appointmentDate) = DATE(:appointmentDate)
  AND (:branchId IS NULL OR taa.branchId = :branchId)
ORDER BY patientName ASC, timeStart ASC, appointmentId ASC
`;

module.exports = {
  getScansByDateQuery,
  getFormFTemplateByDateRangeQuery,
  getScanHeaderInformation,
  getScanReportsQuery,
  getPrescriptionsByDateQuery,
  getOpuSheetsByDateQuery
};
