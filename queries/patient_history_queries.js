const visitHistoryQuery = ` 
SELECT JSON_OBJECT(
	'patientId', pm.patientId,
	'patientName', CONCAT(pm.lastName, COALESCE(pm.firstName, '')),
	'firstName', COALESCE(pm.firstName,''),
	'dob', pm.dateOfBirth,
	'aadhaarNumber', pm.aadhaarNo,
	'mobileNumber', pm.mobileNo,
	'maritalStatus', pm.maritalStatus ,
	'email', pm.email,
	'visitDetails', (
		SELECT JSON_ARRAYAGG(
			  JSON_OBJECT(
			    'visitId', visits.id,
			    'visitType', visits.visit_type,
			    'packageChosen', visits.package_name,
			    'visitDate', visits.visitDate,
			    'isActive', visits.isActive
			  )
			)
			FROM (
			  SELECT 
			    pva.id,
			    (SELECT vtm.name FROM visit_type_master vtm WHERE vtm.id = pva.type) as visit_type,
			    (SELECT pm.name FROM package_master pm WHERE pm.id = pva.packageChosen) as package_name,
			    pva.visitDate,
			    pva.isActive
			  FROM patient_visits_association pva
			  WHERE pva.patientId = pm.id
			  ORDER BY pva.visitDate DESC
			) visits
	)
) as patientDetails from patient_master pm 
where pm.patientId  = :patientId
`;

const embryologyHistoryQuery = `
select 
JSON_ARRAYAGG(
	JSON_OBJECT(
		'appointmentId', caa.id ,
        'appointmentDate', caa.appointmentDate,
		'type', 'Consultation',
		'doctorName', (select cdm.name from consultation_doctor_master cdm where cdm.userId = caa.consultationDoctorId),
		'embryologyDetails',	(
			CASE 
				WHEN NOT EXISTS (select * from consultation_embryology_association cea where cea.consultationId = caa.id) THEN NULL 
				ELSE (
					(
						select JSON_ARRAYAGG(
							JSON_OBJECT(
								'embryologyType', temp.embryologyType,
                                'embryologyName', (select name from embryology_master em where em.id = temp.embryologyType),
								'details', temp.embryologyDetails
							) 
						) from (
							SELECT 
								cea.embryologyType,
								JSON_ARRAYAGG(
									JSON_OBJECT(
										'categoryType', cea.categoryType,
										'imageLink', cea.imageLink,
										'template', cea.template
									) 
								) as embryologyDetails
					        FROM consultation_embryology_association cea
					        WHERE cea.consultationId = caa.id
					        GROUP BY cea.embryologyType
						) as temp
					)
				)
			END
		)
	) 
) as patientInformation
from consultation_appointments_associations caa 
INNER JOIN visit_consultations_associations vca on vca.id = caa.consultationId 
INNER JOIN patient_visits_association pva on pva.id = vca.visitId 
WHERE 
pva.id  = :visitId
and
EXISTS (
	select * from consultation_appointment_line_bills_associations calba where calba.appointmentId = caa.id 
	and calba.billTypeId = 4 and calba.status = 'PAID'
)
group by caa.id  
UNION ALL
select 
JSON_ARRAYAGG(
	JSON_OBJECT(
		'appointmentId', taa.id ,
        'appointmentDate', taa.appointmentDate,
		'type', 'Treatment',
		'doctorName', (select cdm.name from consultation_doctor_master cdm where cdm.userId = taa.consultationDoctorId),
		'embryologyDetails',	(
			CASE 
				WHEN NOT EXISTS (select * from treatement_embryology_association tea where tea.treatmentCycleId = taa.id) THEN NULL 
				ELSE (
					(
						select JSON_ARRAYAGG(
							JSON_OBJECT(
								'embryologyType', temp.embryologyType,
                                'embryologyName', (select name from embryology_master em where em.id = temp.embryologyType),
								'details', temp.embryologyDetails
							) 
						) from (
							SELECT 
								tea.embryologyType,
								JSON_ARRAYAGG(
									JSON_OBJECT(
										'categoryType', tea.categoryType,
										'imageLink', tea.imageLink,
										'template', tea.template
									) 
								) as embryologyDetails
					        FROM treatement_embryology_association tea
					        WHERE tea.treatmentCycleId = taa.id
					        GROUP BY tea.embryologyType
						) as temp
					)
				)
			END
		)
	) 
) as patientInformation
from treatment_appointments_associations taa 
INNER JOIN visit_treatment_cycles_associations vtca on vtca.id = taa.treatmentCycleId 
INNER JOIN patient_visits_association pva on pva.id = vtca.visitId 
WHERE 
pva.id  = :visitId
and
EXISTS (
	select * from treatment_appointment_line_bills_associations talba where talba.appointmentId = taa.id 
	and talba.billTypeId = 4 and talba.status = 'PAID'
)
group by taa.id 
`;

const consultationHistoryByVisitId = `
SELECT
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'consultationId', info.consultationId,
            'consultationType', info.consultationType,
            'consultationDate', info.consultationDate,
            'appointmentDetails', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'appointmentId', appt.id,
                        'appointmentDate', appt.appointmentDate,
                        'appointmentReason', appt.appointmentReason,
                        'appointmentSlot', CONCAT(appt.timeStart, ' - ', appt.timeEnd),
                        'consultationDoctor', appt.consultationDoctor,
                        'currentStage', appt.stage
                    )
                )
                FROM (
                    SELECT 
                        caa.id,
                        caa.appointmentDate,
                        caa.appointmentReasonId,
                        caa.timeStart,
                        caa.timeEnd,
                        (SELECT cdm.name FROM consultation_doctor_master cdm WHERE cdm.userId = caa.consultationDoctorId) AS consultationDoctor,
                        (SELECT arm.name FROM appointment_reason_master arm WHERE arm.id = caa.appointmentReasonId) AS appointmentReason,
                        caa.stage
                    FROM consultation_appointments_associations caa
                    WHERE caa.consultationId = info.consultationId
                    ORDER BY caa.appointmentDate DESC
                ) appt
            )
        )
    ) AS consultationDetails
FROM (
    SELECT 
        vca.id AS consultationId,
        vca.type AS consultationType,
        DATE_FORMAT(vca.createdAt, '%Y-%m-%d') AS consultationDate
    FROM visit_consultations_associations vca
    WHERE vca.visitId = :visitId
    ORDER BY vca.createdAt DESC
) info;
`;

const treatmentHistoryByVisitId = `
	SELECT
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'treatmentCycleId', info.treatmentCycleId,
            'treatmentType', info.treatmentType,
            'treatmentDate', info.treatmentCycleDate,
            'appointmentDetails', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'appointmentId', appt.id,
                        'appointmentDate', appt.appointmentDate,
                        'appointmentReason', appt.appointmentReason,
                        'appointmentSlot', CONCAT(appt.timeStart, ' - ', appt.timeEnd),
                        'consultationDoctor', appt.consultationDoctor,
                        'currentStage', appt.stage
                    )
                )
                FROM (
                    SELECT 
                        taa.id,
                        taa.appointmentDate,
                        taa.appointmentReasonId,
                        taa.timeStart,
                        taa.timeEnd,
                        (SELECT cdm.name FROM consultation_doctor_master cdm WHERE cdm.userId = taa.consultationDoctorId) AS consultationDoctor,
                        (SELECT arm.name FROM appointment_reason_master arm WHERE arm.id = taa.appointmentReasonId) AS appointmentReason,
                        taa.stage
                    FROM treatment_appointments_associations taa
                    WHERE taa.treatmentCycleId = info.treatmentCycleId
                    ORDER BY taa.appointmentDate DESC
                ) appt
            )
        )
    ) AS treatmentDetails
FROM (
    SELECT 
        vtca.id AS treatmentCycleId,
        (select name from treatment_type_master ttm  where ttm.id = vtca.treatmentTypeId) as treatmentType,
        DATE_FORMAT(vtca.createdAt, '%Y-%m-%d') AS treatmentCycleDate
    FROM visit_treatment_cycles_associations vtca
    WHERE vtca.visitId = :visitId
    ORDER BY vtca.createdAt DESC
) info;
`;

const consultationPrescriptionByAppointmentId = `
SELECT 
	JSON_ARRAYAGG(
		JSON_OBJECT(
			'billTypeId', details.billTypeId,
			'billTypeValue', details.billTypeValue,
			'billTypeDetails', details.itemDetails
		) 
	) as lineBillDetails,
	(	
		SELECT JSON_ARRAYAGG(
			JSON_OBJECT(
				'notes',cana.notes,
				'isSpouse', cana.isSpouse
			) 
		) 
		FROM consultation_appointment_notes_associations cana where cana.appointmentId =  :appointmentId
	) as notesDetails
FROM (
	select 
	pd.billTypeId,
    pd.billTypeValue,
    JSON_ARRAYAGG(pd.prescriptionDetails) AS itemDetails 
    FROM (
	    SELECT 
	        calba.billTypeId, 
	        CASE 
	            WHEN calba.billTypeId = 1 THEN 'LAB'
	            WHEN calba.billTypeId = 2 THEN 'SCAN'
	            WHEN calba.billTypeId = 3 THEN 'PHARMACY'
	        END AS billTypeValue,
	        CASE
	            WHEN calba.billTypeId = 1 THEN JSON_OBJECT(
	                'scanId', calba.billTypeValue,
	                'isResultAvailable', (
	                    CASE 
	                        WHEN EXISTS (
	                            SELECT 1 
	                            FROM scan_results sr 
	                            WHERE sr.scanId = calba.billTypeValue 
	                              AND sr.type = 'CONSULTATION' 
	                              AND sr.appointmentId = calba.appointmentId
	                        ) THEN 1
	                        ELSE 0
	                    END
	                ),
	                'isSpouse', calba.isSpouse,
	                'paymentStatus', calba.status,
	                'prescribedQuantity', 1,
	                'purchaseQuantity', 1
	            )
	            WHEN calba.billTypeId = 2 THEN JSON_OBJECT(
	                'labTestId', calba.billTypeValue,
	                'isResultAvailable', (
	                    CASE 
	                        WHEN EXISTS (
	                            SELECT 1 
	                            FROM lab_test_results ltr 
	                            WHERE ltr.labTestId = calba.billTypeValue 
	                              AND ltr.type = 'CONSULTATION' 
	                              AND ltr.appointmentId = calba.appointmentId
	                        ) THEN 1
	                        ELSE 0
	                    END
	                ),
	                'isSpouse', calba.isSpouse,
	                'paymentStatus', calba.status,
	                'prescribedQuantity', 1,
	                'purchaseQuantity', 1
	            )
	            WHEN calba.billTypeId = 3 THEN JSON_OBJECT(
	                'itemId', calba.billTypeValue,
	                'itemName', (
	                    SELECT im.itemName 
	                    FROM stockmanagement.item_master im 
	                    WHERE im.id = calba.billTypeValue
	                ),
	                'isResultAvailable', 0,
	                'isSpouse', calba.isSpouse,
	                'paymentStatus', calba.status,
	                'prescribedQuantity', calba.prescribedQuantity,
	                'purchaseQuantity', calba.purchaseQuantity
	            )
	        END AS prescriptionDetails
	    FROM 
	        consultation_appointment_line_bills_associations calba 
	    WHERE 
	        calba.appointmentId = :appointmentId
	) pd
	GROUP BY 
	    pd.billTypeId, 
	    pd.billTypeValue
) details
`;

const treatmentPrescriptionByAppointmentId = `
SELECT 
	JSON_ARRAYAGG(
		JSON_OBJECT(
			'billTypeId', details.billTypeId,
			'billTypeValue', details.billTypeValue,
			'billTypeDetails', details.itemDetails
		) 
	) as lineBillDetails,
	(	
		SELECT JSON_ARRAYAGG(
			JSON_OBJECT(
				'notes',tana.notes,
				'isSpouse', tana.isSpouse
			) 
		) 
		FROM treatment_appointment_notes_associations tana where tana.appointmentId =  :appointmentId
	) as notesDetails
FROM (
	select 
	pd.billTypeId,
    pd.billTypeValue,
    JSON_ARRAYAGG(pd.prescriptionDetails) AS itemDetails 
    FROM (
	    SELECT 
	        talba.billTypeId, 
	        CASE 
	            WHEN talba.billTypeId = 1 THEN 'LAB'
	            WHEN talba.billTypeId = 2 THEN 'SCAN'
	            WHEN talba.billTypeId = 3 THEN 'PHARMACY'
	        END AS billTypeValue,
	        CASE
	            WHEN talba.billTypeId = 1 THEN JSON_OBJECT(
	                'scanId', talba.billTypeValue,
	                'isResultAvailable', (
	                    CASE 
	                        WHEN EXISTS (
	                            SELECT 1 
	                            FROM scan_results sr 
	                            WHERE sr.scanId = talba.billTypeValue 
	                              AND sr.type = 'TREATMENT' 
	                              AND sr.appointmentId = talba.appointmentId
	                        ) THEN 1
	                        ELSE 0
	                    END
	                ),
	                'isSpouse', talba.isSpouse,
	                'paymentStatus', talba.status,
	                'prescribedQuantity', 1,
	                'purchaseQuantity', 1
	            )
	            WHEN talba.billTypeId = 2 THEN JSON_OBJECT(
	                'labTestId', talba.billTypeValue,
	                'isResultAvailable', (
	                    CASE 
	                        WHEN EXISTS (
	                            SELECT 1 
	                            FROM lab_test_results ltr 
	                            WHERE ltr.labTestId = talba.billTypeValue 
	                              AND ltr.type = 'TREATMENT' 
	                              AND ltr.appointmentId = talba.appointmentId
	                        ) THEN 1
	                        ELSE 0
	                    END
	                ),
	                'isSpouse', talba.isSpouse,
	                'paymentStatus', talba.status,
	                'prescribedQuantity', 1,
	                'purchaseQuantity', 1
	            )
	            WHEN talba.billTypeId = 3 THEN JSON_OBJECT(
	                'itemId', talba.billTypeValue,
	                'itemName', (
	                    SELECT im.itemName 
	                    FROM stockmanagement.item_master im 
	                    WHERE im.id = talba.billTypeValue
	                ),
	                'isResultAvailable', 0,
	                'isSpouse', talba.isSpouse,
	                'paymentStatus', talba.status,
	                'prescribedQuantity', talba.prescribedQuantity,
	                'purchaseQuantity', talba.purchaseQuantity
	            )
	        END AS prescriptionDetails
	    FROM 
	        treatment_appointment_line_bills_associations talba    
	        WHERE talba.appointmentId = :appointmentId
	) pd
	GROUP BY 
	    pd.billTypeId, 
	    pd.billTypeValue
) details
`;

const formFTemplateByPatientIdQuery = `
select 
	psfa.appointmentId,
	psfa.type,
	JSON_OBJECT(
		'appointmentDate', caa.appointmentDate,
		'appointmentReason', (select arm.name from appointment_reason_master arm  where arm.id = caa.appointmentReasonId),
		'doctorName', (select cdm.name from consultation_doctor_master cdm  where cdm.userId = caa.consultationDoctorId)
	) as appointmentInfo,
	JSON_ARRAYAGG(
		JSON_OBJECT(
			'patientId', (select pm.patientId from patient_master pm where pm.id = pva.patientId),
			'type', psfa.type,
			'scanId', psfa.scanId,
			'scanName', (select sm.name from scan_master sm where sm.id = psfa.scanId),
			'isReviewed', psfa.isReviewed,
			'formFUploadLink',psfa.formFUploadLink,
			'formFUploadKey',psfa.formFUploadKey
		) 
) as formFTemplateDetails from patient_scan_formf_associations psfa 
INNER JOIN consultation_appointments_associations caa on caa.id = psfa.appointmentId 
INNER JOIN visit_consultations_associations vca on vca.id = caa.consultationId 
INNER JOIN patient_visits_association pva on pva.id  = vca.visitId  
WHERE psfa.type = 'Consultation' and pva.patientId  = (select pm.id from patient_master pm where pm.patientId = :patientId)
GROUP BY psfa.appointmentId, psfa.type

UNION ALL

select 
	psfa.appointmentId,
	psfa.type,
	JSON_OBJECT(
		'appointmentDate', taa.appointmentDate,
		'appointmentReason', (select arm.name from appointment_reason_master arm  where arm.id = taa.appointmentReasonId),
		'doctorName', (select cdm.name from consultation_doctor_master cdm  where cdm.userId = taa.consultationDoctorId)
	) as appointmentInfo,
	JSON_ARRAYAGG(
		JSON_OBJECT(
			'patientId', (select pm.patientId from patient_master pm where pm.id = pva.patientId),
			'type', psfa.type,
			'scanId', psfa.scanId,
			'scanName', (select sm.name from scan_master sm where sm.id = psfa.scanId),
			'isReviewed', psfa.isReviewed,
			'formFUploadLink',psfa.formFUploadLink,
			'formFUploadKey',psfa.formFUploadKey
		) 
) as formFTemplateDetails from patient_scan_formf_associations psfa 
INNER JOIN treatment_appointments_associations taa on taa.id = psfa.appointmentId 
INNER JOIN visit_treatment_cycles_associations vtca on vtca.id = taa.treatmentCycleId 
INNER JOIN patient_visits_association pva on pva.id  = vtca.visitId  
WHERE psfa.type = 'Treatment' and pva.patientId  = (select pm.id from patient_master pm where pm.patientId = :patientId)
GROUP BY psfa.appointmentId, psfa.type
`;

const prescriptionHistoryByTreatmentCycleIdFollicular = `
select JSON_ARRAYAGG(
	JSON_OBJECT(
		'itemName', itemName,
		'prescribedQuantity',prescribedQuantity,
		'purchaseQuantity',purchaseQuantity,
		'prescriptionDays', prescriptionDays
	) 
) as pharmacyList 
	from (
		select 
			billTypeValue,
			(select im.itemName from stockmanagement.item_master im where im.id = billTypeValue) as itemName,
			SUM(prescribedQuantity) as prescribedQuantity,
			SUM(purchaseQuantity) as purchaseQuantity,
			SUM(prescriptionDays) as prescriptionDays
		from (
				select
					talba.billTypeValue ,
					talba.prescribedQuantity ,
					COALESCE(talba.purchaseQuantity,0) as purchaseQuantity,
					talba.prescriptionDays
				from
					treatment_appointment_line_bills_associations talba
				INNER JOIN treatment_appointments_associations taa on
					taa.id = talba.appointmentId
				WHERE
					taa.treatmentCycleId = :treatmentCycleId and talba.isSpouse = 0 and talba.billTypeId  = 3
		) prescriptionDetails GROUP BY billTypeValue
) itemList
`;

const paymentHistoryByVisitId = `
select
	*
from
	(
	-- Consultation Payments - Pharmacy, Lab, Scans, Embryology
	select
		odm.id,
		odm.paymentMode,
		odm.appointmentId,
		odm.type,
		odm.productType,
		odm.totalOrderAmount,
		odm.paidOrderAmount,
		odm.discountAmount,
		odm.couponCode,
		odm.orderId ,
		CAST(odm.orderDate as DATE) as orderDate
	from
		order_details_master odm
	INNER JOIN consultation_appointments_associations caa on
		caa.id = odm.appointmentId
	INNER JOIN visit_consultations_associations vca on
		vca.id = caa.consultationId
	INNER JOIN patient_visits_association pva on
		pva.id = vca.visitId
	WHERE
		odm.type = 'Consultation'
		and odm.paymentStatus = 'PAID'
		and vca.visitId = :visitId
UNION ALL
	-- Treatment Payments - Pharmacy, Lab, Scans, Embryology
	select
		odm.id,
		odm.paymentMode,
		odm.appointmentId,
		odm.type,
		odm.productType,
		odm.totalOrderAmount,
		odm.paidOrderAmount,
		odm.discountAmount,
		odm.couponCode,
		odm.orderId,
		CAST(odm.orderDate as DATE) as orderDate
	from
		order_details_master odm
	INNER JOIN treatment_appointments_associations taa on
		taa.id = odm.appointmentId
	INNER JOIN visit_treatment_cycles_associations vtca on
		vtca.id = taa.treatmentCycleId
	INNER JOIN patient_visits_association pva on
		pva.id = vtca.visitId
	WHERE
		odm.type = 'Treatment'
		and odm.paymentStatus = 'PAID'
		and vtca.visitId = :visitId
UNION ALL
	-- Treatment Payments - MileStones
	select
		tom.id,
		tom.paymentMode,
		NULL as appointmentId,
		tom.type,
		tom.productType,
		tom.totalOrderAmount,
		tom.paidOrderAmount,
		tom.discountAmount,
		tom.couponCode,
		tom.orderId,
		CAST(tom.orderDate as DATE) as orderDate
	from
		treatment_orders_master tom
	WHERE
		tom.visitId = :visitId
		and tom.paymentStatus = 'PAID'
) paymentHistory
ORDER BY
	orderDate desc
`;

const getNotesHistoryByVisitIdQuery = `
SELECT * 
FROM (
    SELECT 
        CONCAT(pm.lastName, pm.firstName) AS patientName,
		COALESCE(pm.firstName,'') as firstName,
        caa.appointmentDate, 
        'Consultation' AS type, 
        cana.notes 
    FROM consultation_appointment_notes_associations cana 
    INNER JOIN consultation_appointments_associations caa ON cana.appointmentId = caa.id
    INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
    INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
    INNER JOIN patient_master pm ON pva.patientId = pm.id
    WHERE pva.id = :visitId
    UNION 
    SELECT 
        CONCAT(pm.lastName, pm.firstName) AS patientName,
		COALESCE(pm.firstName,'') as firstName,
        taa.appointmentDate, 
        'Treatment' AS type, 
        tana.notes 
    FROM treatment_appointment_notes_associations tana  
    INNER JOIN treatment_appointments_associations taa ON tana.appointmentId = taa.id
    INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId 
    INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
    INNER JOIN patient_master pm ON pva.patientId = pm.id
    WHERE pva.id = :visitId
) AS combinedResults
ORDER BY appointmentDate ASC;
`;

module.exports = {
  visitHistoryQuery,
  embryologyHistoryQuery,
  consultationHistoryByVisitId,
  treatmentHistoryByVisitId,
  consultationPrescriptionByAppointmentId,
  treatmentPrescriptionByAppointmentId,
  formFTemplateByPatientIdQuery,
  prescriptionHistoryByTreatmentCycleIdFollicular,
  paymentHistoryByVisitId,
  getNotesHistoryByVisitIdQuery
};
