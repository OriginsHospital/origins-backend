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
module.exports = {
  getScansByDateQuery,
  getFormFTemplateByDateRangeQuery,
  getScanHeaderInformation
};
