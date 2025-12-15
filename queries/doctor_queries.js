const getDoctorsAvailabiltyListQuery = `SELECT DISTINCT
    cdm.id,
    cdm.userId as doctorId,
    cdm.name as doctorName,
    TIME_FORMAT(cdm.shiftFrom, '%H:%i') AS shiftFrom,
    TIME_FORMAT(cdm.shiftTo, '%H:%i') AS shiftTo
FROM
    consultation_doctor_master cdm
INNER JOIN
    users u ON cdm.userId = u.id
INNER JOIN
    user_branch_association uba ON u.id = uba.userId
WHERE
    uba.branchId IN (:branchId)`;

const getAppointsmentsByDateQuery = `
WITH appointments as (
    SELECT
        caa.id as appointmentId,
        caa.consultationId,
        CASE 
	        WHEN arm.isSpouse = 0 THEN CONCAT(pm.lastName, ' ', pm.firstName)
	        ELSE pga.name
	    END AS patientName,
        CASE 
	        WHEN arm.isSpouse = 0 THEN COALESCE(pm.firstName,'')
	        ELSE pga.name
	    END AS firstName,
        (SELECT vda.donarName FROM visit_donars_associations vda WHERE vda.visitId = vca.visitId LIMIT 1) AS donorName,
        (SELECT vtca.id from visit_treatment_cycles_associations vtca WHERE vtca.visitId IN 
                (SELECT id from patient_visits_association pva where pva.patientId = pm.Id and pva.isActive = 1)
        ) as treatmentCycleId,
        pm.photoPath,
        pm.patientId,
        caa.branchId,
        caa.appointmentType,
       	COALESCE(arm.name,'') as appointmentReason,
       	arm.isSpouse,
        caa.stage,
        TIME_FORMAT(caa.timeStart, '%H:%i') AS timeStart,
        TIME_FORMAT(caa.timeEnd, '%H:%i') AS timeEnd,
        'Consultation' AS type,
        caa.isCompleted , 
        caa.isReviewAppointmentCreated as isReviewCall,
        (
            SELECT
                CASE
                WHEN caa.isReviewAppointmentCreated IS NOT NULL THEN JSON_OBJECT(
                    'reviewAppointmentDate', cra.appointmentDate,
                    'reviewAppointmentTimeStart', TIME_FORMAT(cra.timeStart, '%H:%i'),
                    'reviewAppointmentTimeEnd', TIME_FORMAT(cra.timeEnd, '%H:%i'),
                    'reviewAppointmentDoctor', u.fullName
                )
                ELSE NULL
                END
            FROM consultation_appointments_associations cra
            LEFT JOIN users u ON u.id = cra.consultationDoctorId
            WHERE cra.id = caa.isReviewAppointmentCreated
            LIMIT 1
        ) AS reviewCallInfo,
        (
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM vitals_appointments_associations vaa 
                    WHERE vaa.appointmentId = caa.id AND vaa.type='Consultation'
                ) THEN (
                    SELECT JSON_OBJECT(
                        'weight', vaa.weight,
                        'height', vaa.height,
                        'bp', vaa.bp,
                        'bmi', vaa.bmi,
                        'initials', vaa.initials,
                        'notes', vaa.notes,
                        'vitalsTakenTime', DATE_FORMAT(COALESCE(vaa.updatedAt, vaa.createdAt), '%Y-%m-%d %H:%i:%s')
                    ) FROM vitals_appointments_associations vaa 
                    WHERE vaa.appointmentId = caa.id AND vaa.type='Consultation'
                    LIMIT 1
                )
                ELSE (
                    SELECT JSON_OBJECT(
                        'weight', prev_vaa.weight,
                        'height', prev_vaa.height,
                        'bp', prev_vaa.bp,
                        'bmi', prev_vaa.bmi,
                        'initials', prev_vaa.initials,
                        'notes', prev_vaa.notes,
                        'vitalsTakenTime', DATE_FORMAT(COALESCE(prev_vaa.updatedAt, prev_vaa.createdAt), '%Y-%m-%d %H:%i:%s')
                    ) FROM vitals_appointments_associations prev_vaa
                    WHERE prev_vaa.patientId = pm.patientId and prev_vaa.appointmentDate <= caa.appointmentDate 
                    ORDER BY prev_vaa.appointmentDate DESC 
                    LIMIT 1
                )
            END
        ) as vitalInfo
    FROM
        consultation_appointments_associations caa
    LEFT JOIN appointment_reason_master arm 
		on arm.id = caa.appointmentReasonId
    INNER JOIN visit_consultations_associations vca ON
        vca.id = caa.consultationId
    INNER JOIN patient_visits_association pva ON
        pva.id = vca.visitId
    INNER JOIN patient_master pm ON
        pm.id = pva.patientId
    LEFT JOIN patient_guardian_associations pga 
		ON pga.patientId = pm.id
    WHERE
        caa.consultationDoctorId = :doctorId
        AND caa.appointmentDate = :date
        AND caa.noShow = 0
    UNION ALL
    SELECT
        taa.id as appointmentId,
        null as consultationId,
        CASE 
	        WHEN arm.isSpouse = 0 THEN CONCAT(pm.lastName, ' ', pm.firstName)
	        ELSE pga.name
	    END AS patientName,
        CASE 
	        WHEN arm.isSpouse = 0 THEN COALESCE(pm.firstName,'')
	        ELSE pga.name
	    END AS firstName,
        (SELECT vda.donarName FROM visit_donars_associations vda WHERE vda.visitId = vtca.visitId LIMIT 1) AS donorName,
        taa.treatmentCycleId as treatmentCycleId,
        pm.photoPath,
        pm.patientId,
        taa.branchId,
        taa.appointmentType,
        COALESCE(arm.name,'') as appointmentReason,
        arm.isSpouse,
        taa.stage,
        TIME_FORMAT(taa.timeStart, '%H:%i') AS timeStart,
        TIME_FORMAT(taa.timeEnd, '%H:%i') AS timeEnd,
        'Treatment' AS type,
        taa.isCompleted,
        taa.isReviewAppointmentCreated as isReviewCall,
        (
            SELECT 
                CASE 
                WHEN taa.isReviewAppointmentCreated IS NOT NULL THEN JSON_OBJECT(
                    'reviewAppointmentDate', tra.appointmentDate,
                    'reviewAppointmentTimeStart', TIME_FORMAT(tra.timeStart, '%H:%i'),
                    'reviewAppointmentTimeEnd', TIME_FORMAT(tra.timeEnd, '%H:%i'),
                    'reviewAppointmentDoctor', u.fullName
                )
                ELSE NULL
                END
            FROM treatment_appointments_associations tra
            LEFT JOIN users u ON u.id = tra.consultationDoctorId
            WHERE tra.id = taa.isReviewAppointmentCreated
            LIMIT 1
        ) AS reviewCallInfo,
        (
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM vitals_appointments_associations vaa 
                    WHERE vaa.appointmentId = taa.id AND vaa.type='Treatment'
                ) THEN (
                    SELECT JSON_OBJECT(
                        'weight', vaa.weight,
                        'height', vaa.height,
                        'bp', vaa.bp,
                        'bmi', vaa.bmi,
                        'initials', vaa.initials,
                        'notes', vaa.notes,
                        'vitalsTakenTime', DATE_FORMAT(COALESCE(vaa.updatedAt, vaa.createdAt), '%Y-%m-%d %H:%i:%s')
                    ) FROM vitals_appointments_associations vaa 
                    WHERE vaa.appointmentId = taa.id AND vaa.type='Treatment'
                    LIMIT 1
                )
                ELSE (
                    SELECT JSON_OBJECT(
                        'weight', prev_vaa.weight,
                        'height', prev_vaa.height,
                        'bp', prev_vaa.bp,
                        'bmi', prev_vaa.bmi,
                        'initials', prev_vaa.initials,
                        'notes', prev_vaa.notes,
                        'vitalsTakenTime', DATE_FORMAT(COALESCE(prev_vaa.updatedAt, prev_vaa.createdAt), '%Y-%m-%d %H:%i:%s')
                    ) FROM vitals_appointments_associations prev_vaa
                    WHERE prev_vaa.patientId = pm.patientId and prev_vaa.appointmentDate <= taa.appointmentDate 
                    ORDER BY prev_vaa.appointmentDate DESC 
                    LIMIT 1
                )
            END
        ) as vitalInfo
    FROM
        treatment_appointments_associations taa
    LEFT JOIN appointment_reason_master arm 
		on arm.id = taa.appointmentReasonId
    INNER JOIN visit_treatment_cycles_associations vtca ON
        vtca.id = taa.treatmentCycleId
    INNER JOIN patient_visits_association pva ON
        pva.id = vtca.visitId
    INNER JOIN patient_master pm ON
        pm.id = pva.patientId
    LEFT JOIN patient_guardian_associations pga 
		ON pga.patientId = pm.id
    WHERE
        taa.consultationDoctorId = :doctorId
        AND taa.appointmentDate = :date
        AND taa.noShow = 0
    )
    select * from appointments where stage IN ('Doctor', 'Seen', 'Done') order by isCompleted ASC ,timeStart ASC ;
`;

const getAppointsmentsByPatientQuery = `
WITH appointments as (
    SELECT
        caa.id as appointmentId,
        caa.appointmentDate  as appointmentDate,
        pva.id as visit_id, 
        vtm.name as visitType, 
        caa.consultationId,
        CASE 
	        WHEN arm.isSpouse = 0 THEN CONCAT(pm.lastName, ' ', pm.firstName)
	        ELSE pga.name
	    END AS patientName,
        CASE 
	        WHEN arm.isSpouse = 0 THEN COALESCE(pm.firstName,'')
	        ELSE pga.name
	    END AS firstName,
        (SELECT vda.donarName FROM visit_donars_associations vda WHERE vda.visitId = vca.visitId LIMIT 1) AS donorName,
        null as treatmentCycleId,
        pm.photoPath,
        pm.patientId,
        caa.appointmentType,
       	COALESCE(arm.name,'') as appointmentReason,
        caa.stage,
        TIME_FORMAT(caa.timeStart, '%H:%i') AS timeStart,
        TIME_FORMAT(caa.timeEnd, '%H:%i') AS timeEnd,
        'Consultation' AS type,
        (select JSON_OBJECT(
        	'weight', vaa.weight,
        	'height', vaa.height,
        	'bp', vaa.bp,
        	'bmi', vaa.bmi,
        	'initials', vaa.initials,
        	'notes', vaa.notes
        ) from vitals_appointments_associations vaa where vaa.appointmentId  = caa.id and vaa.type='Consultation') as vitalInfo
    FROM
        consultation_appointments_associations caa
    LEFT JOIN appointment_reason_master arm 
		on arm.id = caa.appointmentReasonId
    INNER JOIN visit_consultations_associations vca ON
        vca.id = caa.consultationId
    INNER JOIN patient_visits_association pva ON
        pva.id = vca.visitId
    INNER JOIN visit_type_master vtm ON
    	pva.type= vtm.id
    INNER JOIN patient_master pm ON
        pm.id = pva.patientId
    LEFT JOIN patient_guardian_associations pga 
		ON pga.patientId = pm.id
    WHERE
        pm.id = :patientId
        
    UNION ALL
    SELECT
        taa.id as appointmentId,
        taa.appointmentDate  as appointmentDate,
        pva.id as visit_id, 
        vtm.name as visitType, 
        null as consultationId,
        CASE 
	        WHEN arm.isSpouse = 0 THEN CONCAT(pm.lastName, ' ', pm.firstName)
	        ELSE pga.name
	    END AS patientName,
        CASE 
	        WHEN arm.isSpouse = 0 THEN COALESCE(pm.firstName,'')
	        ELSE pga.name
	    END AS firstName,
        (SELECT vda.donarName FROM visit_donars_associations vda WHERE vda.visitId = vtca.visitId LIMIT 1) AS donorName,
        taa.treatmentCycleId as treatmentCycleId,
        pm.photoPath,
        pm.patientId,
        taa.appointmentType,
        COALESCE(arm.name,'') as appointmentReason,
        taa.stage,
        TIME_FORMAT(taa.timeStart, '%H:%i') AS timeStart,
        TIME_FORMAT(taa.timeEnd, '%H:%i') AS timeEnd,
        'Treatment' AS type,
        (select JSON_OBJECT(
        	'weight', vaa.weight,
        	'height', vaa.height,
        	'bp', vaa.bp,
        	'bmi', vaa.bmi,
        	'initials', vaa.initials,
        	'notes', vaa.notes
        ) from vitals_appointments_associations vaa where vaa.appointmentId  = taa.id and vaa.type='Treatment') as vitalInfo
    FROM
        treatment_appointments_associations taa
    LEFT JOIN appointment_reason_master arm 
		on arm.id = taa.appointmentReasonId
    INNER JOIN visit_treatment_cycles_associations vtca ON
        vtca.id = taa.treatmentCycleId
    INNER JOIN patient_visits_association pva ON
        pva.id = vtca.visitId
    INNER JOIN visit_type_master vtm ON
    	pva.type= vtm.id
    INNER JOIN patient_master pm ON
        pm.id = pva.patientId
    LEFT JOIN patient_guardian_associations pga 
		ON pga.patientId = pm.id
    WHERE
        pm.id = :patientId
    )
    select * from appointments where stage = 'Doctor' or stage = 'Seen' or stage = 'Done' order by CAST(appointmentDate as DATE) DESC, timeStart DESC;
`;

const getConsulationHistoryByPatientId = `
    select
    vca.type as consultationType,
    vca.id as consultationId,
    'Consultation' as type,
    DATE_FORMAT(vca.createdAt,'%Y-%m-%d') as consultationDate
    from
        visit_consultations_associations vca 
    INNER JOIN patient_visits_association pva ON
        pva.id = vca.visitId
    INNER JOIN patient_master pm ON
        pm.id = pva.patientId
    WHERE pm.patientId = :patientId;
`;

const getTreatmentCycleHistoryByPatientId = `
    select
    vtca.type as treatmentType,
    vtca.id as treatmentCycleId,
    'Treatment' as type,
    DATE_FORMAT(vtca.createdAt,'%Y-%m-%d') as treatmentDate 
    from
    visit_treatment_cycles_associations vtca
    INNER JOIN patient_visits_association pva 
    on
    pva.id = vtca.visitId
    INNER JOIN patient_master pm on
    pm.id = pva.patientId
    where
    pm.patientId = :patientId
`;

const getAppointmentHistoryByConsultationId = `
select
	caa.id as appointmentId,
	caa.consultationDoctorId as doctorId ,
    caa.appointmentType ,
    (select arm.name from appointment_reason_master arm where arm.id = caa.appointmentReasonId) as appointmentReason,
	caa.appointmentDate,
	TIME_FORMAT(caa.timeStart, '%H:%i') as timeStart,
	TIME_FORMAT(caa.timeEnd, '%H:%i') as timeEnd,
	(
	select
		cdm.name
	from
		consultation_doctor_master cdm
	where
		cdm.userId = caa.consultationDoctorId) as doctorName
from
	consultation_appointments_associations caa
INNER JOIN visit_consultations_associations vca on
	vca.id = caa.consultationId
WHERE
	caa.consultationId = :consultationId;
`;

const getAppointmentHistoryByTreatmentCycleId = `
    select
    taa.id as appointmentId,
    taa.consultationDoctorId as doctorId ,
    taa.appointmentType ,
    (select arm.name from appointment_reason_master arm where arm.id = taa.appointmentReasonId) as appointmentReason,
    taa.treatmentCycleId ,
    taa.appointmentDate,
    TIME_FORMAT(taa.timeStart, '%H:%i') as timeStart,
    TIME_FORMAT(taa.timeEnd, '%H:%i') as timeEnd,
    (
    select
        cdm.name
    from
        consultation_doctor_master cdm
    where
        cdm.userId = taa.consultationDoctorId) as doctorName
    from
    treatment_appointments_associations taa
    INNER JOIN visit_treatment_cycles_associations vtca on
    vtca.id = taa.treatmentCycleId 
    WHERE taa.treatmentCycleId  = :treatmentCycleId;
`;

const patientBasicDetailsQuery = `
WITH patientInfo AS (
	select pm.id, pm.patientId , pm.aadhaarNo, pm.addressLine1, pm.addressLine2 ,
    pm.dateOfBirth , pm.firstName , pm.lastName , pm.gender , 
    pm.mobileNo , pm.photoPath , pm.pincode , pm.maritalStatus , pm.patientTypeId,
    (select id from patient_visits_association pva where pva.patientId = pm.Id and pva.isActive = 1) as activeVisitId,
    (
    CASE 
        WHEN EXISTS (
            select * from visit_treatment_cycles_associations vtca WHERE vtca.visitId IN 
                (select id from patient_visits_association pva where pva.patientId = pm.Id and pva.isActive = 1)
        ) THEN TRUE
        ELSE FALSE
    END
    ) as treatmentExists,
    (select cm.name from city_master cm where cm.id = pm.cityId ) as cityName,
    (select sm.name from state_master sm where sm.id = pm.stateId) as stateName,
    (select u.fullName from users u where u.id = pm.createdBy) as createdBy,
    CONCAT(COALESCE((select rtm.name from referral_type_master rtm  where rtm.id = pm.referralId),''), COALESCE(CONCAT(' - ',pm.referralName),'')) as referralType,
    (select u.fullName from users u where u.id = pm.updatedBy) as updatedBy,
    COALESCE(pm.bloodGroup,'N/A') as bloodGroup,
    COALESCE(pga.bloodGroup,'N/A') as spouseBloodGroup
    from patient_master pm 
    LEFT JOIN patient_guardian_associations pga on pm.id = pga.patientId
    where pm.patientId  = :patientId
)
select 
pInfo.*,
CASE 
	WHEN pInfo.treatmentExists = 1 THEN 
			(
				select 
				JSON_OBJECT(
					'treatmentTypeId', vtca.treatmentTypeId,
					'treatementType', (select ttm.name from treatment_type_master ttm where ttm.id = vtca.treatmentTypeId),
					'isConsentRequired', (select ttm.isConsentsExists from treatment_type_master ttm where ttm.id = vtca.treatmentTypeId)
				) from visit_treatment_cycles_associations vtca 
				WHERE vtca.visitId = pInfo.activeVisitId
			)
	ELSE null
END as treatmentDetails,
CASE 
        WHEN pInfo.treatmentExists = 1 THEN 
            (
                select vtca.id 
                from visit_treatment_cycles_associations vtca 
                WHERE vtca.visitId = pInfo.activeVisitId
                LIMIT 1
            )
        ELSE null
    END as treatmentCycleId
from patientInfo pInfo;
`;

const getConsultationLineBillsAndNotesQuery = `
WITH BillDetails AS (
    SELECT 
        lb.id,
        lb.appointmentId,
        lb.billTypeId,
        'Consultation' as type,
        JSON_OBJECT('id', lbm.id, 'name', lbm.billType) AS billType,
        JSON_OBJECT('id', 
                    CASE 
                        WHEN lb.billTypeId = 1 THEN lt.id 
                        WHEN lb.billTypeId = 2 THEN sm.id 
                        WHEN lb.billTypeId = 3 THEN pm.id
                        WHEN lb.billTypeId = 4 THEN elm.id 
                    END,
                    'name', 
                    CASE 
                        WHEN lb.billTypeId = 1 THEN lt.name 
                        WHEN lb.billTypeId = 2 THEN sm.name 
                        WHEN lb.billTypeId = 3 THEN pm.itemName
                        WHEN lb.billTypeId = 4 THEN elm.name
                    END,
                    'amount', 
                    CASE 
                        WHEN lb.billTypeId = 1 THEN ltmba.amount 
                        WHEN lb.billTypeId = 2 THEN smba.amount 
                        WHEN lb.billTypeId = 3 THEN ipm.price
                        WHEN lb.billTypeId = 4 THEN emba.amount
                    END,
                    'prescribedQuantity', 
                    CASE 
                        WHEN lb.billTypeId = 3 THEN lb.prescribedQuantity
                        ELSE NULL
                    END,
                    'prescriptionDetails', 
                    CASE 
	                    WHEN lb.billTypeId = 3 THEN lb.prescriptionDetails
                        ELSE NULL
                    END,
                    'prescriptionDays', 
                    CASE 
	                    WHEN lb.billTypeId = 3 THEN lb.prescriptionDays
                        ELSE NULL
                    END,
                    'refId', 
                    CASE 
                        WHEN lb.billTypeId = 1 THEN lb.id 
                        WHEN lb.billTypeId = 2 THEN lb.id
                        WHEN lb.billTypeId = 4 THEN lb.id
                    END,
                    'status',
                    lb.status,
                    'isSpouse',
                    lb.isSpouse
        ) AS billTypeValue,
        JSON_OBJECT('id', lb.createdBy, 'name', u.fullName) AS createdBy,
        lb.createdAt,
        lb.updatedAt
    FROM 
        consultation_appointment_line_bills_associations lb
    INNER JOIN consultation_appointments_associations caa ON caa.id = lb.appointmentId
    INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
	INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
	INNER JOIN patient_master pmt ON pmt.id = pva.patientId
    LEFT JOIN 
        lab_test_master AS lt ON lb.billTypeValue = lt.id AND lb.billTypeId = 1
    LEFT JOIN 
    	lab_test_master_branch_association ltmba ON ltmba.labTestId = lt.id and ltmba.branchId = caa.branchId
    LEFT JOIN 
        scan_master AS sm ON lb.billTypeValue = sm.id AND lb.billTypeId = 2
    LEFT JOIN
    	scan_master_branch_association smba ON smba.scanId = sm.id and smba.branchId = caa.branchId
    LEFT JOIN 
        embryology_master AS elm ON lb.billTypeValue = elm.id AND lb.billTypeId = 4
    LEFT JOIN 
    	embryology_master_branch_association emba ON emba.embryologyId = elm.id and emba.branchId = caa.branchId
    LEFT JOIN 
        stockmanagement.item_master AS pm ON lb.billTypeValue = pm.id AND lb.billTypeId = 3
    LEFT JOIN
        stockmanagement.item_price_master As ipm on ipm.itemId = pm.id 
    INNER JOIN 
        line_bills_master AS lbm ON lb.billTypeId = lbm.id
    INNER JOIN 
        users u ON u.id = lb.createdBy
    WHERE 
        lb.appointmentId = :appointmentId
)
SELECT 
    appointmentId,
    billType,
    type,
    JSON_ARRAYAGG(billTypeValue) AS billTypeValues,
    createdBy
FROM 
    BillDetails
GROUP BY
    appointmentId,
    billType,
    createdBy;
`;

const getTreatmentLineBillsAndNotesQuery = `
WITH BillDetails AS (
    SELECT 
        lb.id,
        lb.appointmentId,
        'Treatment' as type,
        lb.billTypeId,
        JSON_OBJECT('id', lbm.id, 'name', lbm.billType) AS billType,
        JSON_OBJECT(
                    'id', 
                    CASE 
                        WHEN lb.billTypeId = 1 THEN lt.id 
                        WHEN lb.billTypeId = 2 THEN sm.id 
                        WHEN lb.billTypeId = 3 THEN pm.id
                        WHEN lb.billTypeId = 4 THEN elm.id 
                    END,
                    'name', 
                    CASE 
                        WHEN lb.billTypeId = 1 THEN lt.name 
                        WHEN lb.billTypeId = 2 THEN sm.name 
                        WHEN lb.billTypeId = 3 THEN pm.itemName
                        WHEN lb.billTypeId = 4 THEN elm.name 
                    END,
                    'amount', 
                    CASE 
                        WHEN lb.billTypeId = 1 THEN ltmba.amount 
                        WHEN lb.billTypeId = 2 THEN smba.amount 
                        WHEN lb.billTypeId = 3 THEN ipm.price
                        WHEN lb.billTypeId = 4 THEN emba.amount 
                    END,
                    'prescribedQuantity', 
                    CASE 
                        WHEN lb.billTypeId = 3 THEN lb.prescribedQuantity
                        ELSE NULL
                    END,
                    'prescriptionDetails', 
                    CASE 
	                    WHEN lb.billTypeId = 3 THEN lb.prescriptionDetails
                        ELSE NULL
                    END,
                    'prescriptionDays', 
                    CASE 
	                    WHEN lb.billTypeId = 3 THEN lb.prescriptionDays
                        ELSE NULL
                    END,
                    'refId', 
                    CASE 
                        WHEN lb.billTypeId = 1 THEN lb.id 
                        WHEN lb.billTypeId = 2 THEN lb.id
                        WHEN lb.billTypeId = 4 THEN lb.id 
                    END,
                    'status',
                    lb.status,
                    'isSpouse',
                    lb.isSpouse
        ) AS billTypeValue,
        JSON_OBJECT('id', lb.createdBy, 'name', u.fullName) AS createdBy,
        lb.createdAt,
        lb.updatedAt
    FROM 
        treatment_appointment_line_bills_associations lb
    INNER JOIN treatment_appointments_associations taa ON taa.id = lb.appointmentId
    INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId 
    INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
    INNER JOIN patient_master pmt ON pmt.id = pva.patientId
    LEFT JOIN 
        lab_test_master AS lt ON lb.billTypeValue = lt.id AND lb.billTypeId = 1
    LEFT JOIN 
        lab_test_master_branch_association ltmba ON ltmba.labTestId = lt.id AND ltmba.branchId = taa.branchId
    LEFT JOIN 
        scan_master AS sm ON lb.billTypeValue = sm.id AND lb.billTypeId = 2
    LEFT JOIN 
        scan_master_branch_association smba ON smba.scanId = sm.id AND smba.branchId = taa.branchId
    LEFT JOIN 
        embryology_master AS elm ON lb.billTypeValue = elm.id AND lb.billTypeId = 4
    LEFT JOIN 
    	embryology_master_branch_association emba ON emba.embryologyId = elm.id and emba.branchId = taa.branchId
    LEFT JOIN 
        stockmanagement.item_master AS pm ON lb.billTypeValue = pm.id AND lb.billTypeId = 3
    LEFT JOIN
    	stockmanagement.item_price_master AS ipm ON ipm.itemId = pm.id
    INNER JOIN 
        line_bills_master AS lbm ON lb.billTypeId = lbm.id
    INNER JOIN 
        users u ON u.id = lb.createdBy
    WHERE 
        lb.appointmentId = :appointmentId
)
SELECT 
    appointmentId,
    billType,
    type,
    JSON_ARRAYAGG(billTypeValue) AS billTypeValues,
    createdBy
FROM 
    BillDetails
GROUP BY
    appointmentId,
    billType,
    createdBy;
`;

const getCheckListSheetByPatientIdQuery = `
WITH latestVitalsInformation AS (
	SELECT JSON_OBJECT(
		'patientId', vaa.patientId,
		'patientName', (SELECT CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) AS patientName FROM patient_master pm WHERE pm.patientId = :patientId),
		'firstName', (SELECT COALESCE(pm.firstName, '') FROM patient_master pm WHERE pm.patientId = :patientId),
        'appointmentDate', vaa.appointmentDate,
		'height', vaa.height,
		'weight', vaa.weight,
		'bmi', vaa.bmi,
		'bp', vaa.bp,
		'initials', vaa.initials,
		'notes', vaa.notes,
		'vitalsTakenTime', DATE_FORMAT(COALESCE(vaa.updatedAt, vaa.createdAt), '%Y-%m-%d %H:%i:%s') 
	) AS latestVitals 
	FROM vitals_appointments_associations vaa 
	WHERE patientId = :patientId
	ORDER BY vaa.appointmentDate DESC 
	LIMIT 1
),
patientLabTestsList AS (
	SELECT 
		labTestList.*, 
		ROW_NUMBER() OVER (PARTITION BY labTestList.billTypeValue ORDER BY labTestList.appointmentDate DESC) AS rn
	FROM (
		SELECT 
			pm.patientId, 
			calba.billTypeValue,
            calba.billTypeId,
			calba.appointmentId,
			caa.appointmentDate,
			'CONSULTATION' AS type,
			(SELECT name FROM appointment_reason_master arm WHERE arm.id = caa.appointmentReasonId) AS appointmentReason,
			(SELECT name FROM consultation_doctor_master cdm WHERE cdm.userId = caa.consultationDoctorId) AS doctorName
		FROM 
			consultation_appointment_line_bills_associations calba 
		INNER JOIN 
			consultation_appointments_associations caa ON caa.id = calba.appointmentId 
		INNER JOIN 
			visit_consultations_associations vca ON vca.id = caa.consultationId 
		INNER JOIN 
			patient_visits_association pva ON pva.id = vca.visitId 
		INNER JOIN 
			patient_master pm ON pm.id = pva.patientId 
		WHERE 
			pm.patientId = :patientId AND calba.billTypeId = 1  and calba.isSpouse = 0
		UNION ALL 
		SELECT 
			pm.patientId, 
			talba.billTypeValue,
            talba.billTypeId,
			talba.appointmentId,
			taa.appointmentDate,
			'TREATMENT' AS type,
			(SELECT name FROM appointment_reason_master arm WHERE arm.id = taa.appointmentReasonId) AS appointmentReason,
			(SELECT name FROM consultation_doctor_master cdm WHERE cdm.userId = taa.consultationDoctorId) AS doctorName
		FROM 
			treatment_appointment_line_bills_associations talba 
		INNER JOIN 
			treatment_appointments_associations taa ON taa.id = talba.appointmentId 
		INNER JOIN 
			visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId 
		INNER JOIN 
			patient_visits_association pva ON pva.id = vtca.visitId 
		INNER JOIN 
			patient_master pm ON pm.id = pva.patientId 
		WHERE 
			pm.patientId = :patientId AND talba.billTypeId = 1  and talba.isSpouse = 0
	) AS labTestList 
	ORDER BY labTestList.appointmentDate DESC
),
patientLabTestsLatest AS (
	SELECT 
		JSON_ARRAYAGG(
			JSON_OBJECT(
				'appointmentId', appointmentId,
                'appointmentDate', appointmentDate,
				'type', type,
				'doctorName', doctorName, 
				'appointmentReason', appointmentReason,
				'billTypeValue', billTypeValue,
                'billTypeId', billTypeId,
				'labTestName', (SELECT name FROM lab_test_master ltm WHERE ltm.id = billTypeValue)
			) 
		) AS labTestsList
	FROM patientLabTestsList 
	WHERE rn = 1
	ORDER BY appointmentDate DESC
)
SELECT 
	(SELECT latestVitals FROM latestVitalsInformation) AS latestVitals,
	patientLabTestsLatest.labTestsList
FROM patientLabTestsLatest;
`;

const patientEmbryologyHistoryQuery = `
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
pva.patientId  = (select pm.id from patient_master pm where pm.patientId = :patientId)
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
pva.patientId  = (select pm.id from patient_master pm where pm.patientId = :patientId)
and
EXISTS (
	select * from treatment_appointment_line_bills_associations talba where talba.appointmentId = taa.id 
	and talba.billTypeId = 4 and talba.status = 'PAID'
)
group by taa.id 
`;

module.exports = {
  getDoctorsAvailabiltyListQuery,
  getAppointsmentsByDateQuery,
  getConsulationHistoryByPatientId,
  getAppointmentHistoryByConsultationId,
  patientBasicDetailsQuery,
  getTreatmentCycleHistoryByPatientId,
  getAppointmentHistoryByTreatmentCycleId,
  getConsultationLineBillsAndNotesQuery,
  getTreatmentLineBillsAndNotesQuery,
  getCheckListSheetByPatientIdQuery,
  patientEmbryologyHistoryQuery,
  getAppointsmentsByPatientQuery
};
