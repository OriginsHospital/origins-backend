const getPatientListForEmbryology = `
WITH embryologyData as (
	SELECT 
calba.appointmentId as id,
caa.appointmentDate,
caa.branchId,
(select pm.patientId from patient_master pm  where pm.id = pva.patientId) as patientId,
(select
	 CASE 
        WHEN calba.isSpouse = 0 THEN CONCAT(pm.lastName, ' ', pm.firstName)
        ELSE pga.name
	 END AS patientName
from
	patient_master pm
LEFT JOIN 
	patient_guardian_associations pga 
ON pga.patientId = pm.id
where
	pm.id = pva.patientId) as patientName,
(select cdm.name from consultation_doctor_master cdm where cdm.userId = caa.consultationDoctorId) as doctorName,
'Consultation' as type,
JSON_ARRAYAGG(
	JSON_OBJECT(
		'embryologyId', em.id,
		'embryologyName', em.name,
		'paymentStatus', calba.status
	) 
) as embryologyDetails,
NULL as treatmentInfo
from consultation_appointment_line_bills_associations calba 
INNER JOIN consultation_appointments_associations caa on caa.id  = calba.appointmentId 
INNER JOIN visit_consultations_associations vca on vca.id = caa.consultationId 
INNER JOIN patient_visits_association pva on pva.id  = vca.visitId 
INNER JOIN embryology_master em on em.id = calba.billTypeValue 
WHERE calba.billTypeId  = 4 
GROUP BY calba.appointmentId
UNION ALL
SELECT 
talba.appointmentId as id,
taa.appointmentDate,
taa.branchId,
(select pm.patientId from patient_master pm  where pm.id = pva.patientId) as patientId,
(select
	 CASE 
        WHEN talba.isSpouse = 0 THEN CONCAT(pm.lastName, ' ', pm.firstName)
        ELSE pga.name
	 END AS patientName
from
	patient_master pm
LEFT JOIN 
	patient_guardian_associations pga 
ON pga.patientId = pm.id
where
	pm.id = pva.patientId) as patientName,
(select cdm.name from consultation_doctor_master cdm where cdm.userId = taa.consultationDoctorId) as doctorName,
'Treatment' as type,
JSON_ARRAYAGG(
	JSON_OBJECT(
		'embryologyId', em.id,
		'embryologyName', em.name,
		'paymentStatus', talba.status
	) 
) as embryologyDetails,
JSON_OBJECT(
	'visitId', vtca.visitId,
	'treatmentType', (select name from treatment_type_master ttm where ttm.id = vtca.treatmentTypeId),
	'treatmentCycleId', vtca.id
) as treatmentInfo
from treatment_appointment_line_bills_associations talba  
INNER JOIN treatment_appointments_associations taa on taa.id  = talba.appointmentId 
INNER JOIN visit_treatment_cycles_associations vtca on vtca.id = taa.treatmentCycleId 
INNER JOIN patient_visits_association pva on pva.id  = vtca.visitId 
INNER JOIN embryology_master em on em.id = talba.billTypeValue 
WHERE talba.billTypeId  = 4 
GROUP BY talba.appointmentId
)
SELECT * from embryologyData WHERE (:branchId IS NULL OR branchId = :branchId) 
order by appointmentDate desc;
`;

const getPatientDetailsForTemplate = `
    select
        pm.patientId,
        CONCAT(IFNULL(pm.firstName, ""), " ", IFNULL(pm.lastName, "")) as patientName
    from
        treatment_appointments_associations taa
    INNER JOIN
        visit_treatment_cycles_associations vtca on
        taa.treatmentCycleId = vtca.id
    INNER JOIN patient_visits_association pva on
        pva.id = vtca.visitId
    INNER JOIN patient_master pm ON
        pm.id = pva.patientId
    where
        taa.treatmentCycleId = :treatmentCycleId
    LIMIT 1
`;

const getEmbryologyDetailsByConsultationAppointmentId = `
SELECT 
    calba.billTypeValue AS embryologyType, 
    'Consultation' AS type, 
    calba.appointmentId AS appointmentId,
    CASE 
        WHEN COUNT(DISTINCT cea.id) = 0 THEN NULL
        ELSE JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', cea.id,
                'categoryType', cea.categoryType,
                'imageLink', cea.imageLink,
                'template', cea.template,
                'images', COALESCE(
                    (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', cei.id,
                                'imageUrl', cei.imageUrl,
                                'imageKey', cei.imageKey,
                                'uploadedBy', cei.uploadedBy
                            )
                        )
                        FROM consultation_embryology_images cei
                        WHERE cei.consultationEmbryologyId = cea.id
                    ),
                    JSON_ARRAY()
                )
            )
        )
    END AS embryologyDetails
FROM 
    consultation_appointment_line_bills_associations calba
LEFT JOIN  
    consultation_embryology_association cea 
    ON cea.consultationId = calba.appointmentId 
    AND cea.embryologyType = calba.billTypeValue
WHERE 
    calba.appointmentId = :appointmentId 
    AND calba.billTypeId = 4 
    AND calba.status = 'PAID'
GROUP BY 
    calba.billTypeValue, calba.appointmentId;

`;

const getEmbryologyDetailsByTreatmentAppointmentId = `
SELECT 
    talba.billTypeValue AS embryologyType, 
    'TREATMENT' AS type, 
    talba.appointmentId AS appointmentId,
    CASE 
        WHEN COUNT(DISTINCT tea.id) = 0 THEN NULL
        ELSE JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', tea.id,
                'categoryType', tea.categoryType,
                'imageLink', tea.imageLink,
                'template', tea.template,
                'images', COALESCE(
                    (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', tei.id,
                                'imageUrl', tei.imageUrl,
                                'imageKey', tei.imageKey,
                                'uploadedBy', tei.uploadedBy
                            )
                        )
                        FROM treatment_embryology_images tei
                        WHERE tei.treatmentEmbryologyId = tea.id
                    ), 
                    JSON_ARRAY()
                )
            )
        )
    END AS embryologyDetails 
FROM 
    treatment_appointment_line_bills_associations talba
LEFT JOIN  
    treatement_embryology_association tea 
    ON tea.treatmentCycleId = talba.appointmentId 
    AND tea.embryologyType = talba.billTypeValue 
WHERE 
    talba.appointmentId = :appointmentId 
    AND talba.billTypeId = 4 
    AND talba.status = 'PAID'
GROUP BY 
    talba.billTypeValue, talba.appointmentId;
 
`;

const embryologyImagesByConsultationIdAndType = `
SELECT
	cei.imageUrl
FROM
	consultation_embryology_images cei
where
	cei.consultationEmbryologyId IN (
	SELECT
		cea.id
	from
		consultation_embryology_association cea
	where
		cea.categoryType = :categoryType
		and cea.consultationId = :id
)
`;

const embryologyImagesByTreatmentIdAndType = `
SELECT
	tei.imageUrl
FROM
	treatment_embryology_images tei
where
	tei.treatmentEmbryologyId IN (
	SELECT
		tea.id
	from
		treatement_embryology_association tea
	where
		tea.categoryType = :categoryType
		and tea.treatmentCycleId = :id
)
`;

module.exports = {
  getPatientListForEmbryology,
  getPatientDetailsForTemplate,
  getEmbryologyDetailsByConsultationAppointmentId,
  getEmbryologyDetailsByTreatmentAppointmentId,
  embryologyImagesByConsultationIdAndType,
  embryologyImagesByTreatmentIdAndType
};
