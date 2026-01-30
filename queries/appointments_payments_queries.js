const consultationGetAvailableDoctorsQuery = `
select
	DISTINCT 
	cdm.userId as doctorId, 
	cdm.name
from
	consultation_doctor_master cdm
INNER JOIN user_branch_association uba on
	uba.userId = cdm.userId
where
	uba.branchId in (:branchId)
	and uba.userId not in (
	select
		bsm.doctorId
	from
		blocked_slots_master bsm
	where
		bsm.blockedDate = :date
		and blockType = 'L'
)
`;

const consultationAvailableSlotsQuery = `
SELECT
	cdm.shiftFrom as timeStart ,
	cdm.shiftTo as timeEnd,
	'SHIFT' as type
from
	consultation_doctor_master cdm
where
	cdm.userId = :doctorId
UNION
select
	bsm.timeStart,
	bsm.timeEnd,
	'BLOCK' as type
from
	blocked_slots_master bsm
where
	bsm.doctorId = :doctorId
	and bsm.blockedDate = :date
	and bsm.blockType = 'B'
UNION
select
	caa.timeStart,
	caa.timeEnd,
	'BOOKED' as type
from
	consultation_appointments_associations caa
where
	caa.consultationDoctorId = :doctorId
	and caa.appointmentDate = :date
UNION 
select
	taa.timeStart ,
	taa.timeEnd ,
	'BOOKED' as type
from
	treatment_appointments_associations taa
where
	taa.consultationDoctorId = :doctorId
	and taa.appointmentDate = :date
`;

const isBookedSlotQuery = `
select
COUNT(t.id) as slotCount
from
(
select
	id
from
	consultation_appointments_associations caa
where
	caa.appointmentDate = :date
	and caa.timeStart = :timeStart
	and caa.timeEnd = :timeEnd
	and caa.consultationDoctorId = :consultationDoctorId
	and caa.branchId = :branchId
UNION
select
	id
from
	treatment_appointments_associations taa
where
	taa.appointmentDate = :date
	and taa.timeStart = :timeStart
	and taa.timeEnd = :timeEnd
	and taa.consultationDoctorId = :consultationDoctorId
	and taa.branchId = :branchId
) t
`;

const getAppointmentsByDateQuery = `
with appointments as (
	select
		caa.id as appointmentId,
		caa.branchId,
		CASE 
	        WHEN arm.isSpouse = 0 THEN CONCAT(pm.lastName, ' ', pm.firstName)
	        ELSE pga.name
	    END AS patientName,
		CASE 
	        WHEN arm.isSpouse = 0 THEN COALESCE(pm.firstName, '')
	        ELSE pga.name
	    END AS firstName,
	    CASE 
	        WHEN arm.isSpouse = 0 THEN pm.aadhaarNo
	        ELSE pga.aadhaarNo
	    END AS patientAadhaar,
	    arm.isSpouse,
		'Consultation' as type,
		caa.appointmentDate,
		TIME_FORMAT(caa.timeStart, '%H:%i') as timeStart,
		TIME_FORMAT(caa.timeEnd, '%H:%i') as timeEnd,
		(select name from visit_type_master vtm where vtm.id = pva.type) as visitType,
		(select arm.name from appointment_reason_master arm  where arm.id = caa.appointmentReasonId) as appointmentReason,
		caa.stage,
		(CASE 
			WHEN caa.stage = 'Doctor' THEN IF(TIME_TO_SEC(TIMEDIFF(NOW(), caa.doctorAt))>1800 , 'Yes', 'No') 
			WHEN caa.stage = 'Seen' THEN IF(TIME_TO_SEC(TIMEDIFF(NOW(), caa.seenAt))>1800 , 'Yes', 'No') 
			WHEN caa.stage = 'Arrived' THEN IF(TIME_TO_SEC(TIMEDIFF(NOW(), caa.arrivedAt))>1800 , 'Yes', 'No') 
			WHEN caa.stage = 'Scan' THEN IF(TIME_TO_SEC(TIMEDIFF(NOW(), caa.scanAt))>1800 , 'Yes', 'No') 
			ELSE 'No'
		END) as isDelayed,
		caa.appointmentType,
		caa.consultationDoctorId as doctorId,
		pm.photoPath,
		pm.patientId,
		pm.id as patientAutoId,
		0 as isPackageExists,
		(
		    CASE 
		        WHEN EXISTS (
		            SELECT 1 FROM consultation_appointment_line_bills_associations calba 
		            WHERE calba.appointmentId = caa.id
		        ) THEN 1
		        ELSE 0
		    END
		) AS isPrescribed,
		caa.noShow as noShow,
		pva.id as visitId,
		caa.noShowReason as noShowReason,
		(
			select
				cfba.amount
			from
				consultation_fee_branch_association cfba
			where
				cfba.branchId = caa.branchId and cfba.patientTypeId = pva.type
		) as amountToBePaid,
		(
			select
				cdm.name
			from
				consultation_doctor_master cdm
			where
				cdm.userId = caa.consultationDoctorId
					) as doctorName
	from
		consultation_appointments_associations caa
	LEFT JOIN appointment_reason_master arm 
		on arm.id = caa.appointmentReasonId
	INNER JOIN visit_consultations_associations vca
	on
		vca.id = caa.consultationId
	INNER JOIN patient_visits_association pva on
		pva.id = vca.visitId and pva.isActive = 1
	INNER JOIN visit_type_master vtm on 
		vtm.id = pva.type
	INNER JOIN patient_master pm on
		pm.id = pva.patientId
	LEFT JOIN patient_guardian_associations pga 
		ON pga.patientId = pm.id
	INNER JOIN branch_master bm on
		pm.branchId = bm.id
	WHERE
		caa.appointmentDate = :date
	UNION
	select
		taa.id as appointmentId,
		taa.branchId,
		CASE 
	        WHEN arm.isSpouse = 0 THEN CONCAT(pm.lastName, ' ', pm.firstName)
	        ELSE pga.name
	    END AS patientName,
		CASE 
	        WHEN arm.isSpouse = 0 THEN COALESCE(pm.firstName, '')
	        ELSE pga.name
	    END AS firstName,
	    CASE 
	        WHEN arm.isSpouse = 0 THEN pm.aadhaarNo
	        ELSE pga.aadhaarNo
	    END AS patientAadhaar,
	    arm.isSpouse,
		'Treatment' as type,
		taa.appointmentDate,
		TIME_FORMAT(taa.timeStart, '%H:%i') as timeStart,
		TIME_FORMAT(taa.timeEnd, '%H:%i') as timeEnd,
		(select name from visit_type_master vtm where vtm.id = pva.type) as visitType,
		(select arm.name from appointment_reason_master arm  where arm.id = taa.appointmentReasonId) as appointmentReason,
		taa.stage,
		(CASE 
			WHEN taa.stage = 'Doctor' THEN IF(TIME_TO_SEC(TIMEDIFF(NOW(), taa.doctorAt))>1800 , 'Yes', 'No') 
			WHEN taa.stage = 'Seen' THEN IF(TIME_TO_SEC(TIMEDIFF(NOW(), taa.seenAt))>1800 , 'Yes', 'No') 
			WHEN taa.stage = 'Arrived' THEN IF(TIME_TO_SEC(TIMEDIFF(NOW(), taa.arrivedAt))>1800 , 'Yes', 'No') 
			WHEN taa.stage = 'Scan' THEN IF(TIME_TO_SEC(TIMEDIFF(NOW(), taa.scanAt))>1800 , 'Yes', 'No') 
			ELSE 'No'
		END) as isDelayed,
		taa.appointmentType,
		taa.consultationDoctorId as doctorId,
		pm.photoPath,
		pm.patientId,
		pm.id as patientAutoId,
		(
			select ttm.isPackageExists from treatment_type_master ttm where ttm.id = vtca.treatmentTypeId
		) as isPackageExists,
		(
		    CASE 
		        WHEN EXISTS (
		            SELECT 1 FROM treatment_appointment_line_bills_associations talba 
		            WHERE talba.appointmentId = taa.id
		        ) THEN 1
		        ELSE 0
		    END
		) AS isPrescribed,
		taa.noShow as noShow,
		pva.id as visitId,
		taa.noShowReason as noShowReason,
		0 as amountToBePaid,
		(
			select
				cdm.name
			from
				consultation_doctor_master cdm
			where
				cdm.userId = taa.consultationDoctorId
					) as doctorName
	from
		treatment_appointments_associations taa
	LEFT JOIN appointment_reason_master arm 
		on arm.id = taa.appointmentReasonId
	INNER JOIN visit_treatment_cycles_associations vtca ON
		vtca.id = taa.treatmentCycleId
	INNER JOIN patient_visits_association pva on
		pva.id = vtca.visitId and pva.isActive = 1
	INNER JOIN patient_master pm on
		pm.id = pva.patientId
	LEFT JOIN patient_guardian_associations pga 
		ON pga.patientId = pm.id
	WHERE
		taa.appointmentDate = :date
)
select * from appointments WHERE (:branchId IS NULL OR branchId = :branchId) order by noshow DESC, timeStart;
`;

const getAppointmentByConsultationId = `
select
caa.id as consultationId,
caa.appointmentDate as appointmentDate ,
(
	select
		cdm.name
	from
		consultation_doctor_master cdm
	where
		cdm.userId = caa.consultationDoctorId
			) as doctorName,
caa.consultationDoctorId as doctorId,
TIME_FORMAT(caa.timeStart, '%H:%i') as timeStart ,
TIME_FORMAT(caa.timeEnd, '%H:%i') as timeEnd
from
consultation_appointments_associations caa
where
caa.consultationId = :id;
`;

const getAppointmentByTreatmentId = `
select
	taa.id as appointmentId,
	taa.appointmentDate as appointmentDate ,
	TIME_FORMAT(taa.timeStart, '%H:%i') as timeStart ,
	TIME_FORMAT(taa.timeEnd, '%H:%i') as timeEnd,
	taa.consultationDoctorId as doctorId,
	(
		select
			cdm.name
		from
			consultation_doctor_master cdm
		where
			cdm.userId = taa.consultationDoctorId
				) as doctorName
from
	treatment_appointments_associations taa
WHERE
	taa.treatmentCycleId = :id;
`;

const consultationFeeCheckQuery = `
select 
	(
	select
		pm.patientId
	from
		patient_master pm
	where
		pm.id = pva.patientId) as patientId,
	odm.orderDate
from
	order_details_master odm
INNER JOIN
consultation_appointments_associations caa on
	caa.id = odm.appointmentId
INNER JOIN visit_consultations_associations vca on
	vca.id = caa.consultationId
INNER JOIN patient_visits_association pva on
	pva.id = vca.visitId
INNER JOIN visit_type_master vtm on 
	vtm.id = pva.type
WHERE
	odm.type = 'CONSULTATION'
	and odm.productType = 'CONSULTATION FEE'
	and odm.paymentStatus  = 'PAID'
	and
DATEDIFF(CAST(NOW() AS DATE), CAST(odm.orderDate AS DATE)) <= (
		CASE 
			WHEN vtm.id = 1 THEN 180   -- Fertility
			WHEN vtm.id = 2 THEN 7     -- Antenatal
			WHEN vtm.id = 3 THEN 7     -- Gynec
		END
	)
	and pva.patientId = (
	select
		pm.id
	from
		patient_master pm
	where
		pm.patientId = :patientId)
`;

const getLastConsultationFeePaymentDetails = `
WITH ranked_orders AS (
    SELECT
        (
            SELECT pm.patientId
            FROM patient_master pm
            WHERE pm.id = pva.patientId
        ) AS patientId,
        CAST(odm.orderDate AS DATE) AS orderDate,
        odm.paymentMode,
        (
            SELECT name
            FROM appointment_reason_master arm
            WHERE arm.id = caa.appointmentReasonId
        ) AS appointmentReason,
        odm.type,
        caa.id AS appointmentId,
        vtm.name AS visitType,
        (
            select
				cfba.validity
			from
				consultation_fee_branch_association cfba
			where
				cfba.branchId = caa.branchId
				and cfba.patientTypeId = pva.type
        ) AS validityPeriod,
        ROW_NUMBER() OVER (PARTITION BY pva.patientId ORDER BY odm.orderDate DESC) AS row_num
    FROM
        order_details_master odm
    INNER JOIN
        consultation_appointments_associations caa ON caa.id = odm.appointmentId
    INNER JOIN
        visit_consultations_associations vca ON vca.id = caa.consultationId
    INNER JOIN
        patient_visits_association pva ON pva.id = vca.visitId AND pva.isActive = 1
    INNER JOIN
        visit_type_master vtm ON vtm.id = pva.type
    INNER JOIN 
    	patient_master pm on pm.id = pva.patientId
    INNER JOIN
    	branch_master bm on bm.id = pm.branchId
    WHERE
        odm.type = 'CONSULTATION'
        AND odm.productType = 'CONSULTATION FEE'
        AND odm.paymentStatus = 'PAID'
        AND pva.patientId IN (
            SELECT pm.id
            FROM patient_master pm
            WHERE pm.patientId IN (:patientIds)
        )
)
SELECT
    patientId,
    orderDate,
    paymentMode,
    appointmentReason,
    type,
    appointmentId,
    visitType,
    validityPeriod
FROM
    ranked_orders
WHERE
    row_num = 1
ORDER BY
    orderDate DESC;
`;

const getTreatmentStatusQuery = `
SELECT JSON_OBJECT(
    'START_ICSI', 
    CASE 
        WHEN :treatmentType IN (4, 5) THEN 
            CASE WHEN vpa.day1Date IS NULL THEN 0 ELSE 1 END
        ELSE -1 
    END,
    'START_IUI', 
    CASE 
        WHEN :treatmentType IN (2, 3) THEN 
            CASE WHEN tt.startDate IS NULL THEN 0 ELSE 1 END
        ELSE -1 
    END,
    'START_OITI', 
    CASE 
        WHEN :treatmentType = 1 THEN 
            CASE WHEN tt.startDate IS NULL THEN 0 ELSE 1 END
        ELSE -1 
    END,
    'TRIGGER_START', 
    CASE 
        WHEN :treatmentType IN (4, 5) THEN 
            CASE WHEN tt.triggerStartDate IS NULL THEN 0 ELSE 1 END
        WHEN :treatmentType IN (6,7) THEN 
        	CASE WHEN tt.triggerStartDate IS NULL THEN -1 ELSE 1 END
        ELSE -1 
    END,
    'FET_START', 
    CASE 
        WHEN :treatmentType IN (4, 5, 6, 7) THEN 
            CASE WHEN vpa.fetDate IS NULL THEN 0 ELSE 1 END
        ELSE -1 
    END,
    'END_ICSI', 
    CASE 
        WHEN :treatmentType IN (4, 5) THEN 
        	CASE WHEN tt.endDate IS NULL THEN 0 ELSE 1 END
        ELSE -1 
    END,
    'END_IUI', 
    CASE 
        WHEN :treatmentType IN (2, 3) THEN 
        	CASE WHEN tt.endDate IS NULL THEN 0 ELSE 1 END
        ELSE -1 
    END,
    'END_OITI', 
    CASE 
        WHEN :treatmentType = 1 THEN 
        	CASE WHEN tt.endDate IS NULL THEN 0 ELSE 1 END
        ELSE -1 
    END,
    'END_FET', 
    CASE 
        WHEN :treatmentType IN (4, 5, 6, 7) THEN 
        	CASE WHEN tt.fetEndedDate IS NULL THEN 0 ELSE 1 END
        ELSE -1 
    END,
    'START_HYSTEROSCOPY', 
    CASE 
        WHEN :treatmentType IN (1, 2, 3, 4, 5, 6, 7) THEN 
        	CASE WHEN tt.hysteroscopyTime IS NULL THEN 0 ELSE 1 END
        ELSE -1 
    END,
	'START_ERA',
    CASE 
        WHEN :treatmentType IN (4, 5, 6, 7) THEN 
            CASE 
                WHEN tt.eraStartDate IS NULL AND tt.fetStartDate IS NULL THEN 0
                WHEN tt.eraStartDate IS NOT NULL THEN 1
                WHEN tt.fetStartDate IS NOT NULL THEN -1
            END
        ELSE -1
    END,
    'END_ERA',
    CASE 
        WHEN :treatmentType IN (4, 5, 6, 7) THEN 
            CASE 
                WHEN tt.fetstartDate is NULL and tt.eraEndedDate IS NULL THEN 0
                WHEN tt.fetStartDate is NULL and tt.eraEndedDate IS NOT NULL THEN  1
                ELSE -1
            END
        ELSE -1
    END
) AS treatmentStatus
FROM visit_treatment_cycles_associations vtca 
INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId 
LEFT JOIN visit_packages_associations vpa ON vpa.visitId = vtca.visitId 
LEFT JOIN treatment_timestamps tt ON tt.visitId = vtca.visitId AND tt.treatmentType = :treatmentType
WHERE vtca.visitId = :visitId;
`;

const checkFinalConsultationExistsQuery = `
select vca.id,vca.visitId, vca.type from defaultdb.visit_consultations_associations vca 
INNER JOIN defaultdb.patient_visits_association pva ON vca.visitId  = pva.id 
INNER JOIN defaultdb.patient_master pm ON pm.id = pva.patientId 
WHERE pm.id = :patientId
`;

const icsiNotStartedCheckQuery = `
SELECT (
	CASE 
		WHEN vpa.day1Date IS NULL THEN TRUE
		ELSE FALSE
	END
) as statusCheck 
from visit_packages_associations vpa where vpa.visitId = :id
`;

const oitiNotStartedCheckQuery = `
SELECT (
	CASE 
		WHEN tt.startDate IS NULL THEN TRUE
		ELSE FALSE
	END
) as statusCheck 
from treatment_timestamps tt where tt.visitId = :id and tt.treatmentType = :treatmentType
`;

const iuiNotStartedCheckQuery = `
SELECT (
	CASE 
		WHEN tt.startDate IS NULL THEN TRUE
		ELSE FALSE
	END
) as statusCheck 
from treatment_timestamps tt where tt.visitId = :id and tt.treatmentType = :treatmentType
`;

const icsiStartedCheckQuery = `
SELECT (
	CASE 
		WHEN vpa.day1Date IS NOT NULL THEN TRUE
		ELSE FALSE
	END
) as statusCheck 
from visit_packages_associations vpa where vpa.visitId = :id
`;

const iuiStartedCheckQuery = `
SELECT (
	CASE 
		WHEN tt.startDate IS NOT NULL THEN TRUE
		ELSE FALSE
	END
) as statusCheck 
from treatment_timestamps tt where tt.visitId = :id and tt.treatmentType = :treatmentType
`;

const oitiStartedCheckQuery = `
SELECT (
	CASE 
		WHEN tt.startDate IS NOT NULL THEN TRUE
		ELSE FALSE
	END
) as statusCheck 
from treatment_timestamps tt where tt.visitId = :id and tt.treatmentType = :treatmentType
`;

const fetStartedCheckQuery = `
SELECT (
	CASE 
		WHEN vpa.fetDate IS NOT NULL THEN TRUE
		ELSE FALSE
	END
) as statusCheck 
from visit_packages_associations vpa where vpa.visitId = :id
`;

const icsiConsentsExistsQuery = `
SELECT (
	CASE 
		WHEN EXISTS (select
				*
			from
				visit_icsi_consents_associations vica
			where
				vica.visitId = vtca.visitId) 
				THEN TRUE
			ELSE FALSE
	END) as statusCheck
from visit_treatment_cycles_associations vtca where vtca.visitId = :id
`;

const iuiConsentsExistsQuery = `
SELECT (
	CASE 
		WHEN EXISTS (select
				*
			from
				visit_iui_consents_associations vica
			where
				vica.visitId = vtca.visitId) 
				THEN TRUE
			ELSE FALSE
	END) as statusCheck
from visit_treatment_cycles_associations vtca where vtca.visitId = :id
`;

const getPatientFromVisitId = `
select * from patient_master pm 
INNER JOIN  patient_visits_association  pva 
on pm.id = pva.patientId 
where pva.id = :visitId
`;

const getTreatmentCycleInfoFromVisitId = `
select * from visit_treatment_cycles_associations vtca
where vtca.visitId = :visitId
`;
const checkForPatientPaymentPending = `
WITH milestoneAmounts as (
	SELECT amount, productTypeEnum, dateColumn, mileStoneStartedDate, displayName FROM (
		{unionQuery}
	) availableMileStones
),
totalPayments as (
	SELECT 
		tom.productType,
		COALESCE(SUM(paidOrderAmountBeforeDiscount),0) AS totalPaid
	FROM treatment_orders_master tom 
	WHERE tom.visitId = :visitId and tom.paymentStatus = 'PAID' GROUP BY productType
)
SELECT 
	milestoneAmounts.amount as totalAmount, 
	milestoneAmounts.productTypeEnum, 
	milestoneAmounts.dateColumn,
	milestoneAmounts.mileStoneStartedDate,
	milestoneAmounts.displayName,
	COALESCE(totalPayments.totalPaid,0) as totalPaid,
	(milestoneAmounts.amount - COALESCE(totalPayments.totalPaid,0)) AS pending_amount
FROM milestoneAmounts 
LEFT JOIN totalPayments ON milestoneAmounts.productTypeEnum = totalPayments.productType
`;
const appointmentReasonsQuery = `
select
	arm.name,
	arm.id,
	COALESCE(acba.appointmentCharges, arm.appointmentCharges) as appointmentCharges ,
	arm.isSpouse
from
	visit_consultations_associations vca
INNER JOIN patient_visits_association pva on
	pva.id = vca.visitId
INNER JOIN patient_master pm on
	pm.id  = pva.patientId 
INNER JOIN appointment_reason_master arm on
	arm.visit_type = pva.type
LEFT JOIN appointment_charges_branch_association acba on 
	acba.branchId  = pm.branchId and acba.appointmentReasonId  = arm.id 
WHERE
	vca.id = :id
	and arm.isOther !=1
	and :type = 'consultation'
UNION ALL 
select
	arm.name,
	arm.id,
	COALESCE(acba.appointmentCharges, arm.appointmentCharges) as appointmentCharges,
	arm.isSpouse
from
	visit_treatment_cycles_associations vtca
INNER JOIN patient_visits_association pva on
	pva.id = vtca.visitId
INNER JOIN patient_master pm on
	pm.id  = pva.patientId 
INNER JOIN appointment_reason_master arm on
	arm.visit_type = pva.type
LEFT JOIN appointment_charges_branch_association acba on 
	acba.branchId  = pm.branchId and acba.appointmentReasonId  = arm.id 
WHERE
	vtca.id = :id
	and arm.isOther !=1
	and :type = 'treatment'
`;

const appointmentReasonsByPatientTypeId = `
select * from appointment_reason_master arm 
where arm.visit_type = :patientTypeId and arm.isOther !=1
`;

const fetNotStartedCheckQuery = `
SELECT (
	CASE 
		WHEN vpa.fetDate IS NULL THEN TRUE
		ELSE FALSE
	END
) as statusCheck 
from visit_packages_associations vpa where vpa.visitId = :id
`;

const eraNotStartedCheckQuery = `
SELECT (
	CASE 
		WHEN vpa.eraDate IS NULL THEN TRUE
		ELSE FALSE
	END
) as statusCheck 
from visit_packages_associations vpa where vpa.visitId = :id
`;

const fetConsentsExistsQuery = `
SELECT (
	CASE 
		WHEN EXISTS (select
				*
			from
				visit_fet_consents_associations vfca 
			where
				vfca.visitId = vtca.visitId) 
				THEN TRUE
			ELSE FALSE
	END) as statusCheck
from visit_treatment_cycles_associations vtca where vtca.visitId = :id
`;

const eraConsentsExistsQuery = `
SELECT (
	CASE 
		WHEN EXISTS (select
				*
			from
				visit_era_consents_associations veca 
			where
				veca.visitId = vtca.visitId) 
				THEN TRUE
			ELSE FALSE
	END) as statusCheck
from visit_treatment_cycles_associations vtca where vtca.visitId = :id
`;

const appointmentChargesQuery = `
WITH appointments as (
	SELECT
		taa.id as appointmentId,
		taa.appointmentDate as mileStoneStartedDate,
		CONCAT('APPOINTMENT_', taa.id) as productTypeEnum,
		(select arm.name from appointment_reason_master arm where taa.appointmentReasonId = arm.id) as displayName,
		(
		SELECT
			COALESCE(acba.appointmentCharges, arm.appointmentCharges)
		FROM
			appointment_reason_master arm
		LEFT JOIN appointment_charges_branch_association acba 
	            ON
			acba.appointmentReasonId = arm.id
			AND acba.branchId = taa.branchId
		WHERE
			taa.appointmentReasonId = arm.id) AS amount -- appointment charge is totalAmount
	FROM
		treatment_appointments_associations taa
	INNER JOIN visit_treatment_cycles_associations vtca ON
		taa.treatmentCycleId = vtca.id
	INNER JOIN patient_visits_association pva on
		pva.id = vtca.visitId
	INNER JOIN patient_master pm on
		pm.id  = pva.patientId
	WHERE
		vtca.visitId = :visitId),
totalPayments as (
	SELECT 
		tom.productType,
		COALESCE(SUM(paidOrderAmountBeforeDiscount),0) AS totalPaid
	FROM treatment_orders_master tom 
	WHERE tom.visitId = :visitId and tom.paymentStatus = 'PAID' GROUP BY productType
)
SELECT 
	appointments.amount as totalAmount, 
	appointments.productTypeEnum, 
	'' as dateColumn, 
	appointments.mileStoneStartedDate,
	appointments.displayName,
	COALESCE(totalPayments.totalPaid,0) as totalPaid,
	(appointments.amount - COALESCE(totalPayments.totalPaid,0)) AS pending_amount
FROM appointments 
LEFT JOIN totalPayments ON appointments.productTypeEnum = totalPayments.productType;
`;

const getAppointmentInfoByAppointmentId = `
select caa.stage as currentStage from consultation_appointments_associations caa where caa.id = :appointmentId and :type = 'Consultation'
UNION ALL
select taa.stage as currentStage from treatment_appointments_associations taa where taa.id = :appointmentId and :type = 'Treatment'
`;
const checkPaymentExistsByAppointmentId = `
select odm.id, 'ORDER' as type from order_details_master odm where odm.appointmentId = :appointmentId and odm.type = :type
	UNION ALL
select tom.id, 'TREATMENT_ORDER' as type from treatment_orders_master tom where tom.visitId  IN (
	SELECT vca.visitId from consultation_appointments_associations caa 
	INNER JOIN visit_consultations_associations vca on vca.id = caa.consultationId 
	WHERE :type = 'Consultation' and caa.id = :appointmentId 
	UNION ALL 
	SELECT vtca.visitId from treatment_appointments_associations taa INNER JOIN visit_treatment_cycles_associations vtca 
	on vtca.id = taa.treatmentCycleId 
	WHERE :type = 'Treatment' and taa.id = :appointmentId 
)
`;

const checkAntentalPatientVital = `
select (
		    CASE
		        WHEN EXISTS (
		            SELECT 1 FROM vitals_appointments_associations vaa
		            WHERE vaa.appointmentId = :appointmentId
					AND vaa.type = :type
		        ) THEN 1
		        ELSE 0
		    END
		) as antenatalVitalExists
`;

const checkAppointmentExistsOnSameDateQuery = `
WITH patientList AS (
    SELECT DISTINCT pva.patientId
    FROM consultation_appointments_associations caa
    INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
    INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
    WHERE caa.consultationId = :consultationOrTreatmentCycleId and :type = 'Consultation'
    UNION ALL
    SELECT DISTINCT pva.patientId
    FROM treatment_appointments_associations taa
    INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId
    INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
    WHERE taa.treatmentCycleId = :consultationOrTreatmentCycleId and :type = 'Treatment'
)
SELECT id
FROM (
    SELECT 
        caa.id AS id
    FROM consultation_appointments_associations caa
    INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
    INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
    WHERE caa.appointmentDate = :appointmentDate and TIME_FORMAT(caa.timeStart, '%H:%i') = :timeStart and TIME_FORMAT(caa.timeEnd, '%H:%i')  = :timeEnd and :type = 'Consultation'
      AND pva.patientId IN (SELECT patientId FROM patientList) AND caa.branchId = :branchId
    UNION ALL
    SELECT 
        taa.id AS id
    FROM treatment_appointments_associations taa
    INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId
    INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
    WHERE taa.appointmentDate = :appointmentDate and TIME_FORMAT(taa.timeStart, '%H:%i') = :timeStart and TIME_FORMAT(taa.timeEnd, '%H:%i')  = :timeEnd and :type = 'Treatment'
      AND pva.patientId IN (SELECT patientId FROM patientList) AND taa.branchId = :branchId
) filtered_results;
`;

const completedStageCheckQuery = `
SELECT 
CASE 
	WHEN statusTable.scanResultsStatus = 1 AND statusTable.labTestStatus = 1 AND statusTable.pharmacyStatus = 1 AND statusTable.embryologyStatus = 1 THEN 1 
	ELSE 0
END as moveToCompleteStage
FROM (
	SELECT
	caa.id AS appointmentId,
	(
		CASE 
			WHEN COALESCE(scan_bills.total_scan_bills, 0) = 0 THEN 1 -- when no scan bills found
			WHEN 
				COALESCE(scan_bills.total_scan_bills, 0) = COALESCE(scan_results.completed_scan_results, 0) -- check if all scans are completed
				AND
				COALESCE(scan_bills.paid_scan_bills, 0) = COALESCE(scan_bills.total_scan_bills, 0) -- check if all scan bills are paid
			THEN 1
			ELSE 0
		END
	) AS scanResultsStatus,
	(
		CASE 
			WHEN COALESCE(lab_bills.total_lab_bills, 0) = 0 THEN 1 -- when no lab bills found
			WHEN 
				COALESCE(lab_bills.total_lab_bills, 0) = COALESCE(lab_results.completed_lab_results, 0) -- check if all lab tests are completed
				AND
				COALESCE(lab_bills.paid_lab_bills, 0) = COALESCE(lab_bills.total_lab_bills, 0) -- check if all lab bills are paid
			THEN 1 
			ELSE 0
		END
	) AS labTestStatus,
	(
		CASE 
			WHEN COALESCE(pharmacy_bills.total_pharmacy_bills, 0) = 0 THEN 1 -- when no pharmacy bills found
			WHEN 
				COALESCE(pharmacy_bills.paid_pharmacy_bills, 0) = COALESCE(pharmacy_bills.total_pharmacy_bills, 0) -- check if all pharmacy bills are paid
			THEN 1 
			ELSE 0
		END
	) AS pharmacyStatus, 
	(
		CASE 
			WHEN COALESCE(embryology_bills.total_embryology_bills , 0) = 0 THEN 1 -- when no embryology bills found
			WHEN 
				COALESCE(embryology_bills.paid_embryology_bills, 0) = COALESCE(embryology_bills.total_embryology_bills, 0) -- check if all embryology bills are paid
			THEN 1 
			ELSE 0
		END
	) AS embryologyStatus
FROM
	consultation_appointments_associations caa
-- Subquery for scan results and bills
LEFT JOIN (
	SELECT
		sr.appointmentId,
		COUNT(*) AS total_scan_results,
		SUM(CASE WHEN sr.scanTestStatus = 2 THEN 1 ELSE 0 END) AS completed_scan_results
	FROM scan_results sr
	WHERE sr.type = 'Consultation'
	GROUP BY sr.appointmentId
) scan_results ON scan_results.appointmentId = caa.id
LEFT JOIN (
	SELECT
		calba.appointmentId,
		SUM(CASE WHEN calba.billTypeId = 2 THEN 1 ELSE 0 END) AS total_scan_bills,
		SUM(CASE WHEN calba.billTypeId = 2 AND calba.status = 'PAID' THEN 1 ELSE 0 END) AS paid_scan_bills
	FROM consultation_appointment_line_bills_associations calba
	GROUP BY calba.appointmentId
) scan_bills ON scan_bills.appointmentId = caa.id
-- Subquery for lab results and bills
LEFT JOIN (
	SELECT
		ltr.appointmentId,
		COUNT(*) AS total_lab_results,
		SUM(CASE WHEN ltr.labTestStatus = 2 THEN 1 ELSE 0 END) AS completed_lab_results
	FROM lab_test_results ltr
	WHERE ltr.type = 'Consultation'
	GROUP BY ltr.appointmentId
) lab_results ON lab_results.appointmentId = caa.id
LEFT JOIN (
	SELECT
		calba.appointmentId,
		SUM(CASE WHEN calba.billTypeId = 1 THEN 1 ELSE 0 END) AS total_lab_bills,
		SUM(CASE WHEN calba.billTypeId = 1 AND calba.status = 'PAID' THEN 1 ELSE 0 END) AS paid_lab_bills
	FROM consultation_appointment_line_bills_associations calba
	GROUP BY calba.appointmentId
) lab_bills ON lab_bills.appointmentId = caa.id
-- Subquery for pharmacy bills
LEFT JOIN (
	SELECT
		calba.appointmentId,
		SUM(CASE WHEN calba.billTypeId = 3 THEN 1 ELSE 0 END) AS total_pharmacy_bills,
		SUM(CASE WHEN calba.billTypeId = 3 AND calba.status = 'PAID' THEN 1 ELSE 0 END) AS paid_pharmacy_bills
	FROM consultation_appointment_line_bills_associations calba
	GROUP BY calba.appointmentId
) pharmacy_bills ON pharmacy_bills.appointmentId = caa.id
-- Subquery for Embryology Bills
LEFT JOIN (
	SELECT
		calba.appointmentId,
		SUM(CASE WHEN calba.billTypeId = 4 THEN 1 ELSE 0 END) AS total_embryology_bills,
		SUM(CASE WHEN calba.billTypeId = 4 AND calba.status = 'PAID' THEN 1 ELSE 0 END) AS paid_embryology_bills
	FROM consultation_appointment_line_bills_associations calba
	GROUP BY calba.appointmentId
) embryology_bills ON embryology_bills.appointmentId = caa.id
WHERE caa.id = :appointmentId
	AND :type = 'Consultation'
GROUP BY caa.id
UNION ALL 
SELECT
	taa.id AS appointmentId,
	(
		CASE 
			WHEN COALESCE(scan_bills.total_scan_bills, 0) = 0 THEN 1 -- when no scan bills found
			WHEN 
				COALESCE(scan_bills.total_scan_bills, 0) = COALESCE(scan_results.completed_scan_results, 0) -- check if all scans are completed
				AND
				COALESCE(scan_bills.paid_scan_bills, 0) = COALESCE(scan_bills.total_scan_bills, 0) -- check if all scan bills are paid
			THEN 1
			ELSE 0
		END
	) AS scanResultsStatus,
	(
		CASE 
			WHEN COALESCE(lab_bills.total_lab_bills, 0) = 0 THEN 1 -- when no lab bills found
			WHEN 
				COALESCE(lab_bills.total_lab_bills, 0) = COALESCE(lab_results.completed_lab_results, 0) -- check if all lab tests are completed
				AND
				COALESCE(lab_bills.paid_lab_bills, 0) = COALESCE(lab_bills.total_lab_bills, 0) -- check if all lab bills are paid
			THEN 1 
			ELSE 0
		END
	) AS labTestStatus,
	(
		CASE 
			WHEN COALESCE(pharmacy_bills.total_pharmacy_bills, 0) = 0 THEN 1 -- when no pharmacy bills found
			WHEN 
				COALESCE(pharmacy_bills.paid_pharmacy_bills, 0) = COALESCE(pharmacy_bills.total_pharmacy_bills, 0) -- check if all pharmacy bills are paid
			THEN 1 
			ELSE 0
		END
	) AS pharmacyStatus,
	(
		CASE 
			WHEN COALESCE(embryology_bills.total_embryology_bills , 0) = 0 THEN 1 -- when no embryology bills found
			WHEN 
				COALESCE(embryology_bills.paid_embryology_bills, 0) = COALESCE(embryology_bills.total_embryology_bills, 0) -- check if all embryology bills are paid
			THEN 1 
			ELSE 0
		END
	) AS embryologyStatus
FROM
	treatment_appointments_associations taa
-- Subquery for scan results and bills
LEFT JOIN (
	SELECT
		sr.appointmentId,
		COUNT(*) AS total_scan_results,
		SUM(CASE WHEN sr.scanTestStatus = 2 THEN 1 ELSE 0 END) AS completed_scan_results
	FROM scan_results sr
	WHERE sr.type = 'Treatment'
	GROUP BY sr.appointmentId
) scan_results ON scan_results.appointmentId = taa.id
LEFT JOIN (
	SELECT
		talba.appointmentId,
		SUM(CASE WHEN talba.billTypeId = 2 THEN 1 ELSE 0 END) AS total_scan_bills,
		SUM(CASE WHEN talba.billTypeId = 2 AND talba.status = 'PAID' THEN 1 ELSE 0 END) AS paid_scan_bills
	FROM treatment_appointment_line_bills_associations talba
	GROUP BY talba.appointmentId
) scan_bills ON scan_bills.appointmentId = taa.id
-- Subquery for lab results and bills
LEFT JOIN (
	SELECT
		ltr.appointmentId,
		COUNT(*) AS total_lab_results,
		SUM(CASE WHEN ltr.labTestStatus = 2 THEN 1 ELSE 0 END) AS completed_lab_results
	FROM lab_test_results ltr
	WHERE ltr.type = 'Treatment'
	GROUP BY ltr.appointmentId
) lab_results ON lab_results.appointmentId = taa.id
LEFT JOIN (
	SELECT
		talba.appointmentId,
		SUM(CASE WHEN talba.billTypeId = 1 THEN 1 ELSE 0 END) AS total_lab_bills,
		SUM(CASE WHEN talba.billTypeId = 1 AND talba.status = 'PAID' THEN 1 ELSE 0 END) AS paid_lab_bills
	FROM treatment_appointment_line_bills_associations talba
	GROUP BY talba.appointmentId
) lab_bills ON lab_bills.appointmentId = taa.id
-- Subquery for pharmacy bills
LEFT JOIN (
	SELECT
		talba.appointmentId,
		SUM(CASE WHEN talba.billTypeId = 3 THEN 1 ELSE 0 END) AS total_pharmacy_bills,
		SUM(CASE WHEN talba.billTypeId = 3 AND talba.status = 'PAID' THEN 1 ELSE 0 END) AS paid_pharmacy_bills
	FROM treatment_appointment_line_bills_associations talba
	GROUP BY talba.appointmentId
) pharmacy_bills ON pharmacy_bills.appointmentId = taa.id
-- Subquery for Embryology Bills
LEFT JOIN (
	SELECT
		talba.appointmentId,
		SUM(CASE WHEN talba.billTypeId = 4 THEN 1 ELSE 0 END) AS total_embryology_bills,
		SUM(CASE WHEN talba.billTypeId = 4 AND talba.status = 'PAID' THEN 1 ELSE 0 END) AS paid_embryology_bills
	FROM treatment_appointment_line_bills_associations talba
	GROUP BY talba.appointmentId
) embryology_bills ON embryology_bills.appointmentId = taa.id
WHERE taa.id = :appointmentId
	AND :type = 'Treatment'
GROUP BY taa.id
) statusTable
`;

const printPrescriptionQuery = `
SELECT 
	(	
		SELECT
			JSON_OBJECT(
				'patientName',CASE 
						        WHEN :isSpouse = 0 THEN CONCAT(pm.lastName, ' ', pm.firstName)
						        ELSE pga.name
	    					END,
				'currentDate', CAST(NOW() AS DATE),
				'gender', CASE 
					        WHEN :isSpouse = 0 THEN pm.gender
					        ELSE COALESCE(pga.gender,'')
	    				END ,
				'patientAge',CASE 
						        WHEN :isSpouse = 0 THEN YEAR(NOW()) - YEAR(pm.dateOfBirth)
						        ELSE pga.age
	 						END,
				'appointmentReason', appointmentInformation.appointmentReason
			) as patientDetails
		FROM
			patient_master pm
		LEFT JOIN 
			patient_guardian_associations pga on pm.id = pga.patientId
		WHERE
			pm.id = appointmentInformation.patientId
	) as patientDetails,
	(
		SELECT 
			JSON_ARRAYAGG(
				JSON_OBJECT(
					'lineBillId', lineBillsData.billTypeId,
					'lineBillDetails', lineBillsData.billTypeValues
				) 
			)
		FROM (
			SELECT
				calba.billTypeId , 
				JSON_ARRAYAGG(
					JSON_OBJECT(
						'name', (
							CASE 
								WHEN calba.billTypeId  = 1 THEN (SELECT ltm.name FROM lab_test_master ltm WHERE ltm.id = calba.billTypeValue)
								WHEN calba.billTypeId  = 2 THEN (SELECT sm.name FROM scan_master sm WHERE sm.id = calba.billTypeValue)
								WHEN calba.billTypeId  = 3 THEN (SELECT im.itemName FROM stockmanagement.item_master im WHERE im.id = calba.billTypeValue)
								WHEN calba.billTypeId  = 4 THEN (SELECT em.name FROM embryology_master em WHERE em.id = calba.billTypeValue)
							END
						),
						'purchaseQuantity', calba.purchaseQuantity,
						'prescribedQuantity', calba.prescribedQuantity,
						'dosage', CONCAT(calba.prescriptionDetails, ' for ', calba.prescriptionDays, ' days')
					)
				) as billTypeValues 
			FROM 
				consultation_appointment_line_bills_associations calba WHERE calba.appointmentId = appointmentInformation.id and calba.isSpouse = :isSpouse
			GROUP by calba.billTypeId
	    ) as lineBillsData
	) as prescriptionDetails,
	(
		SELECT cana.notes from consultation_appointment_notes_associations cana where cana.appointmentId = appointmentInformation.id and cana.isSpouse = :isSpouse
	) as notesDetails
FROM (
	SELECT
		caa.id,
		pva.patientId,
		arm.isSpouse,
		arm.name as appointmentReason
	from
		consultation_appointments_associations caa
	INNER JOIN appointment_reason_master arm on
		arm.id = caa.appointmentReasonId
	INNER JOIN visit_consultations_associations vca on
		vca.id = caa.consultationId
	INNER JOIN patient_visits_association pva on
		pva.id = vca.visitId
	WHERE
		caa.id = :appointmentId
		and :type = 'Consultation'
) appointmentInformation
UNION ALL
SELECT 
	(	
		SELECT
			JSON_OBJECT(
				'patientName',CASE 
						        WHEN :isSpouse = 0 THEN CONCAT(pm.lastName, ' ', pm.firstName)
						        ELSE pga.name
	    					END,
				'currentDate', CAST(NOW() AS DATE),
				'gender', CASE 
					        WHEN :isSpouse = 0 THEN pm.gender
					        ELSE COALESCE(pga.gender,'')
	    				END ,
				'patientAge',CASE 
						        WHEN :isSpouse = 0 THEN YEAR(NOW()) - YEAR(pm.dateOfBirth)
						        ELSE pga.age
	 						END,
				'appointmentReason', appointmentInformation.appointmentReason
			) as patientDetails
		FROM
			patient_master pm
		LEFT JOIN 
			patient_guardian_associations pga on pm.id = pga.patientId
		WHERE
			pm.id = appointmentInformation.patientId
	) as patientDetails,
	(
		SELECT 
			JSON_ARRAYAGG(
				JSON_OBJECT(
					'lineBillId', lineBillsData.billTypeId,
					'lineBillDetails', lineBillsData.billTypeValues
				) 
			)
		FROM (
			SELECT
				talba.billTypeId , 
				JSON_ARRAYAGG(
					JSON_OBJECT(
						'name', (
							CASE 
								WHEN talba.billTypeId  = 1 THEN (SELECT ltm.name FROM lab_test_master ltm WHERE ltm.id = talba.billTypeValue)
								WHEN talba.billTypeId  = 2 THEN (SELECT sm.name FROM scan_master sm WHERE sm.id = talba.billTypeValue)
								WHEN talba.billTypeId  = 3 THEN (SELECT im.itemName FROM stockmanagement.item_master im WHERE im.id = talba.billTypeValue)
								WHEN talba.billTypeId  = 4 THEN (SELECT em.name FROM embryology_master em WHERE em.id = talba.billTypeValue)
							END
						),
						'purchaseQuantity', talba.purchaseQuantity,
						'prescribedQuantity', talba.prescribedQuantity,
						'dosage', CONCAT(talba.prescriptionDetails, ' for ', talba.prescriptionDays, ' days')
					)
				) as billTypeValues 
			FROM 
				treatment_appointment_line_bills_associations talba WHERE talba.appointmentId = appointmentInformation.id and talba.isSpouse = :isSpouse
			GROUP by talba.billTypeId
	    ) as lineBillsData
	) as prescriptionDetails,
	(
		SELECT tana.notes from treatment_appointment_notes_associations tana where tana.appointmentId = appointmentInformation.id and tana.isSpouse = :isSpouse
	) as notesDetails
FROM (
	SELECT
		taa.id,
		pva.patientId,
		arm.isSpouse,
		arm.name as appointmentReason
	from
		treatment_appointments_associations taa
	INNER JOIN appointment_reason_master arm on
		arm.id = taa.appointmentReasonId
	INNER JOIN visit_treatment_cycles_associations vtca on
		vtca.id = taa.treatmentCycleId
	INNER JOIN patient_visits_association pva on
		pva.id = vtca.visitId
	WHERE
		taa.id = :appointmentId
		and :type = 'Treatment'
) appointmentInformation;
`;

const getPendingAppointmentReason = `
SELECT
	billType, 
	JSON_ARRAYAGG(
		JSON_OBJECT(
			'billTypeValue', billTypeValue,
			'paymentStatus', paymentStatus,
			'resultStatus', resultStatus
		) 
	) as statusInformation
FROM (
SELECT 
	CASE
		WHEN calba.billTypeId  = 1 THEN 'Lab'
		WHEN calba.billTypeId  = 2 THEN 'Scan'
		WHEN calba.billTypeId  = 3 THEN 'Pharmacy'
		WHEN calba.billTypeId  = 4 THEN 'Embryology'
	END as billType, 
	CASE 
		WHEN calba.billTypeId  = 1 THEN (select ltm.name from lab_test_master ltm where ltm.id = calba.billTypeValue)
		WHEN calba.billTypeId  = 2 THEN (select sm.name from scan_master sm where sm.id = calba.billTypeValue)
		WHEN calba.billTypeId  = 3 THEN (select im.itemName from stockmanagement.item_master im where im.id = calba.billTypeValue)
		WHEN calba.billTypeId  = 4 THEN (select em.name from embryology_master em  where em.id = calba.billTypeValue)
	END as billTypeValue,
	calba.status as paymentStatus, 
	CASE 
		WHEN calba.billTypeId  = 1 THEN COALESCE((select
					CASE 
						WHEN ltr.labTestStatus = 2 THEN 'Completed'
						WHEN ltr.labTestStatus = 1 THEN 'Result Not Updated'
						ELSE 'Sample Not Collected'
					END 
				from
					lab_test_results ltr
				where
					ltr.appointmentId = calba.appointmentId
					and ltr.labTestId = calba.billTypeValue
					and ltr.isSpouse = calba.isSpouse), 'Sample Not Collected')
		WHEN calba.billTypeId  = 2 THEN COALESCE((select
					CASE 
						WHEN sr.scanTestStatus = 2 THEN 'Completed'
						ELSE 'Result Not Updated'
					END 
				from
					scan_results sr
				where
					sr.appointmentId = calba.appointmentId
					and sr.scanId = calba.billTypeValue), 'Result Not Updated')
		WHEN calba.billTypeId  = 3 THEN '-'
		WHEN calba.billTypeId  = 4 THEN '-'
	END as resultStatus
FROM consultation_appointment_line_bills_associations calba 
WHERE calba.appointmentId = :appointmentId and :type = 'Consultation' and calba.billTypeId IN (1,2,3,4)
UNION ALL
SELECT 
	CASE
		WHEN talba.billTypeId  = 1 THEN 'Lab'
		WHEN talba.billTypeId  = 2 THEN 'Scan'
		WHEN talba.billTypeId  = 3 THEN 'Pharmacy'
		WHEN talba.billTypeId  = 4 THEN 'Embryology'
	END as billType, 
	CASE 
		WHEN talba.billTypeId  = 1 THEN (select ltm.name from lab_test_master ltm where ltm.id = talba.billTypeValue)
		WHEN talba.billTypeId  = 2 THEN (select sm.name from scan_master sm where sm.id = talba.billTypeValue)
		WHEN talba.billTypeId  = 3 THEN (select im.itemName from stockmanagement.item_master im where im.id = talba.billTypeValue)
		WHEN talba.billTypeId  = 4 THEN (select em.name from embryology_master em  where em.id = talba.billTypeValue)
	END as billTypeValue,
	talba.status as paymentStatus, 
	CASE 
		WHEN talba.billTypeId  = 1 THEN COALESCE((select
					CASE 
						WHEN ltr.labTestStatus = 2 THEN 'Completed'
						WHEN ltr.labTestStatus = 1 THEN 'Result Not Updated'
						ELSE 'Sample Not Collected'
					END 
				from
					lab_test_results ltr
				where
					ltr.appointmentId = talba.appointmentId
					and ltr.labTestId = talba.billTypeValue
					and ltr.isSpouse = talba.isSpouse), 'Sample Not Collected')
		WHEN talba.billTypeId  = 2 THEN COALESCE((select
					CASE 
						WHEN sr.scanTestStatus = 2 THEN 'Completed'
						ELSE 'Result Not Updated'
					END 
				from
					scan_results sr
				where
					sr.appointmentId = talba.appointmentId
					and sr.scanId = talba.billTypeValue), 'Result Not Updated')
		WHEN talba.billTypeId  = 3 THEN '-'
		WHEN talba.billTypeId  = 4 THEN '-'
	END as resultStatus
FROM treatment_appointment_line_bills_associations talba 
WHERE talba.appointmentId = :appointmentId and :type = 'Treatment' and talba.billTypeId IN (1,2,3,4)
) pendingReasons
GROUP BY billType;
`;

const checkIsFirstAppointmentInVisit = `
WITH ranked_appointments AS (	
	SELECT 
	    appointmentId,
	    type,
	    appointmentDate,
	    RANK() OVER (ORDER BY appointmentDate ASC, timeStart ASC) AS overall_rank
	FROM (
	    SELECT
	        caa.id AS appointmentId,
	        CAST(caa.appointmentDate AS DATE) AS appointmentDate,
	        'Consultation' AS type,
	        caa.timeStart
	    FROM
	        consultation_appointments_associations caa
	    INNER JOIN visit_consultations_associations vca 
	        ON vca.id = caa.consultationId
	    INNER JOIN patient_visits_association pva 
	        ON pva.id = vca.visitId
	    WHERE vca.visitId = :visitId
	
	    UNION ALL
	
	    SELECT
	        taa.id AS appointmentId,
	        CAST(taa.appointmentDate AS DATE) AS appointmentDate,
	        'Treatment' AS type,
	        taa.timeStart
	    FROM
	        treatment_appointments_associations taa
	    INNER JOIN visit_treatment_cycles_associations vtca 
	        ON vtca.id = taa.treatmentCycleId
	    INNER JOIN patient_visits_association pva 
	        ON pva.id = vtca.visitId
	    WHERE vtca.visitId = :visitId
	) AS combined_appointments
)
SELECT 
	CASE 
		WHEN ranked_appointments.overall_rank = 1 THEN 1 ELSE 0
	END as isFirstAppointment
FROM ranked_appointments
WHERE 
ranked_appointments.appointmentId = :appointmentId and ranked_appointments.type = :type
`;

const getAllActiveVisitAppointmentsQuery = `
select caa.id as appointmentId, caa.appointmentDate,(select u.fullName from users u where u.id = caa.consultationDoctorId) as doctorName, 'Consultation' as type from consultation_appointments_associations caa 
INNER JOIN visit_consultations_associations vca on vca.id = caa.consultationId and vca.visitId = :activeVisitId
UNION
select taa.id as appointmentId,  taa.appointmentDate,(select u.fullName from users u where u.id = taa.consultationDoctorId) as doctorName , 'Treatment' as type from treatment_appointments_associations taa 
INNER JOIN visit_treatment_cycles_associations vtca on vtca.id = taa.treatmentCycleId  and vtca.visitId = :activeVisitId
`;

module.exports = {
  consultationGetAvailableDoctorsQuery,
  consultationAvailableSlotsQuery,
  isBookedSlotQuery,
  getAppointmentsByDateQuery,
  getAppointmentByConsultationId,
  getAppointmentByTreatmentId,
  consultationFeeCheckQuery,
  getLastConsultationFeePaymentDetails,
  getTreatmentStatusQuery,
  checkFinalConsultationExistsQuery,
  icsiConsentsExistsQuery,
  icsiNotStartedCheckQuery,
  icsiStartedCheckQuery,
  getPatientFromVisitId,
  getTreatmentCycleInfoFromVisitId,
  checkForPatientPaymentPending,
  appointmentReasonsQuery,
  fetNotStartedCheckQuery,
  fetConsentsExistsQuery,
  eraNotStartedCheckQuery,
  eraConsentsExistsQuery,
  appointmentChargesQuery,
  fetStartedCheckQuery,
  oitiNotStartedCheckQuery,
  iuiNotStartedCheckQuery,
  iuiConsentsExistsQuery,
  iuiStartedCheckQuery,
  oitiStartedCheckQuery,
  appointmentReasonsByPatientTypeId,
  getAppointmentInfoByAppointmentId,
  checkPaymentExistsByAppointmentId,
  checkAppointmentExistsOnSameDateQuery,
  checkAntentalPatientVital,
  completedStageCheckQuery,
  printPrescriptionQuery,
  getPendingAppointmentReason,
  checkIsFirstAppointmentInVisit,
  getAllActiveVisitAppointmentsQuery
};
