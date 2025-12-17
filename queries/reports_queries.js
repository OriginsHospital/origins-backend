const appointmentStageDurationReportQuery = `
WITH stageReportData as (
	SELECT * FROM (
		SELECT
		    JSON_OBJECT(
		        'patientId', pm.patientId ,
		        'patientName', CONCAT(IFNULL(pm.firstName, ''), ' ', IFNULL(pm.lastName, '')),
		        'doctorName', (SELECT cdm.name FROM consultation_doctor_master cdm WHERE cdm.userId = caa.consultationDoctorId),
		        'appointmentReason', COALESCE((SELECT arm.name from appointment_reason_master arm  where arm.id = caa.appointmentReasonId),'NA')
		    ) AS appointmentDetails,
		    'Consultation' AS type,
		    caa.appointmentDate,
            caa.id as appointmentId,
		    pm.branchId,
		    CASE 
		        WHEN caa.noShow = 1 THEN 'No Show'
		        WHEN LOWER(caa.stage) = 'done' THEN 'Completed'
		        ELSE caa.stage
		    END AS currentStage,
		    CASE WHEN caa.noShow = 1 THEN 'No Show' ELSE IFNULL(DATE_FORMAT(caa.scanAt , '%d-%m-%Y %h:%i %p'), 'Pending') END AS scanAt,
		    CASE 
		        WHEN caa.noShow = 1 THEN 'No Show' 
		        WHEN caa.isDoctor = 1 THEN CEIL(TIMESTAMPDIFF(SECOND, caa.scanAt, caa.doctorAt) / 60)
		        ELSE 'NA'
		    END AS scanStageDuration,
		    CASE WHEN caa.noShow = 1 THEN 'No Show' ELSE IFNULL(DATE_FORMAT(caa.doctorAt , '%d-%m-%Y %h:%i %p'), 'Pending') END AS doctorAt,
		    CASE 
		        WHEN caa.noShow = 1 THEN 'No Show' 
		        WHEN caa.isSeen = 1 THEN CEIL(TIMESTAMPDIFF(SECOND, caa.doctorAt, caa.seenAt) / 60)
		        ELSE 'NA'
		    END AS doctorStageDuration,
		    CASE WHEN caa.noShow = 1 THEN 'No Show' ELSE IFNULL(DATE_FORMAT(caa.seenAt , '%d-%m-%Y %h:%i %p'), 'Pending') END AS seenAt,
		    CASE 
		        WHEN caa.noShow = 1 THEN 'No Show'
		        WHEN caa.isDone = 1 THEN CEIL(TIMESTAMPDIFF(SECOND, caa.seenAt, caa.doneAt) / 60)
		        ELSE 'NA'
		    END AS seenStageDuration,
		    CASE WHEN caa.noShow = 1 THEN 'No Show' ELSE IFNULL(DATE_FORMAT(caa.doneAt , '%d-%m-%Y %h:%i %p'), 'Pending') END AS doneAt
		FROM 
		    consultation_appointments_associations caa
		INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
		INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
		INNER JOIN patient_master pm on pm.id = pva.patientId 
		
		UNION ALL 
		
		SELECT
		    JSON_OBJECT(
		        'patientId', pm.patientId ,
		        'patientName', CONCAT(IFNULL(pm.firstName, ''), ' ', IFNULL(pm.lastName, '')),
		        'doctorName', (SELECT cdm.name FROM consultation_doctor_master cdm WHERE cdm.userId = taa.consultationDoctorId),
		        'appointmentReason', COALESCE((SELECT arm.name from appointment_reason_master arm  where arm.id = taa.appointmentReasonId),'NA')
		    ) AS appointmentDetails,
		    'Treatment' AS type, 
		    taa.appointmentDate,
            taa.id as appointmentId,
		    pm.branchId,
		    CASE 
		        WHEN taa.noShow = 1 THEN 'No Show'
		        WHEN LOWER(taa.stage) = 'done' THEN 'Completed'
		        ELSE taa.stage
		    END AS currentStage,
		    CASE WHEN taa.noShow = 1 THEN 'No Show' ELSE IFNULL(DATE_FORMAT(taa.scanAt , '%d-%m-%Y %h:%i %p'), 'Pending') END AS scanAt,
		    CASE 
		        WHEN taa.noShow = 1 THEN 'No Show' 
		        WHEN taa.isDoctor = 1 THEN CEIL(TIMESTAMPDIFF(SECOND, taa.scanAt, taa.doctorAt) / 60)
		        ELSE 'NA'
		    END AS scanStageDuration,
		    CASE WHEN taa.noShow = 1 THEN 'No Show' ELSE IFNULL(DATE_FORMAT(taa.doctorAt , '%d-%m-%Y %h:%i %p'), 'Pending') END AS doctorAt,
		    CASE 
		        WHEN taa.noShow = 1 THEN 'No Show' 
		        WHEN taa.isSeen = 1 THEN CEIL(TIMESTAMPDIFF(SECOND, taa.doctorAt, taa.seenAt) / 60)
		        ELSE 'NA'
		    END AS doctorStageDuration,
		    CASE WHEN taa.noShow = 1 THEN 'No Show' ELSE IFNULL(DATE_FORMAT(taa.seenAt , '%d-%m-%Y %h:%i %p'), 'Pending') END AS seenAt,
		    CASE 
		        WHEN taa.noShow = 1 THEN 'No Show' 
		        WHEN taa.isDone = 1 THEN CEIL(TIMESTAMPDIFF(SECOND, taa.seenAt, taa.doneAt) / 60)
		        ELSE 'NA'
		    END AS seenStageDuration,
		    CASE WHEN taa.noShow = 1 THEN 'No Show' ELSE IFNULL(DATE_FORMAT(taa.doneAt , '%d-%m-%Y %h:%i %p'), 'Pending') END AS doneAt
		FROM 
		    treatment_appointments_associations taa
		INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId 
		INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
		INNER JOIN patient_master pm on pm.id = pva.patientId 
	) reportData 
	{{whereCondition}}
),
stageStats as (
	 SELECT
        JSON_OBJECT(
            'scan', JSON_OBJECT(
                '1-15', COUNT(CASE WHEN scanStageDuration BETWEEN 1 AND 15 THEN 1 END),
                '16-30', COUNT(CASE WHEN scanStageDuration BETWEEN 16 AND 30 THEN 1 END),
                '31-45', COUNT(CASE WHEN scanStageDuration BETWEEN 31 AND 45 THEN 1 END),
                '46-60', COUNT(CASE WHEN scanStageDuration BETWEEN 46 AND 60 THEN 1 END),
                '60-plus', COUNT(CASE WHEN scanStageDuration > 60 THEN 1 END)
            ),
            'doctor', JSON_OBJECT(
                '1-15', COUNT(CASE WHEN doctorStageDuration BETWEEN 1 AND 15 THEN 1 END),
                '16-30', COUNT(CASE WHEN doctorStageDuration BETWEEN 16 AND 30 THEN 1 END),
                '31-45', COUNT(CASE WHEN doctorStageDuration BETWEEN 31 AND 45 THEN 1 END),
                '46-60', COUNT(CASE WHEN doctorStageDuration BETWEEN 46 AND 60 THEN 1 END),
                '60-plus', COUNT(CASE WHEN doctorStageDuration > 60 THEN 1 END)
            ),
            'seen', JSON_OBJECT(
                '1-15', COUNT(CASE WHEN seenStageDuration BETWEEN 1 AND 15 THEN 1 END),
                '16-30', COUNT(CASE WHEN seenStageDuration BETWEEN 16 AND 30 THEN 1 END),
                '31-45', COUNT(CASE WHEN seenStageDuration BETWEEN 31 AND 45 THEN 1 END),
                '46-60', COUNT(CASE WHEN seenStageDuration BETWEEN 46 AND 60 THEN 1 END),
                '60-plus', COUNT(CASE WHEN seenStageDuration > 60 THEN 1 END)
            )
        ) AS stats
    FROM stageReportData
)
SELECT 
    JSON_OBJECT(
        'stageReportDetails', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'appointmentDetails', appointmentDetails,
                    'appointmentId', appointmentId,
                    'type', type,
                    'appointmentDate', appointmentDate,
                    'branchId', branchId,
                    'currentStage', currentStage,
                    'scanAt', scanAt,
                    'scanStageDuration', scanStageDuration,
                    'doctorAt', doctorAt,
                    'doctorStageDuration', doctorStageDuration,
                    'seenAt', seenAt,
                    'seenStageDuration', seenStageDuration,
                    'doneAt', doneAt
                )
            )
            FROM stageReportData
        ),
        'stats', (SELECT stats FROM stageStats LIMIT 1)
    ) AS stageDurationReport;
`;

const grnVendorPaymentReportsQuery = `
select
	gm.id,gm.grnNo ,sm.supplier, sm.contactNumber as supplierContact, gm.date ,gm.supplierGstNumber ,gm.invoiceNumber ,gm.status ,
	(
        CASE
            WHEN DATEDIFF(CAST(NOW() as DATE), gm.date) > 45 and gm.status <> 'PAID' THEN JSON_OBJECT('stage', 'DUE', 'delay', CONCAT(DATEDIFF(CAST(NOW() as DATE), gm.date) - 45, ' ', 'days'))
            WHEN DATEDIFF(CAST(NOW() as DATE), gm.date) < 45 and gm.status <> 'PAID' THEN JSON_OBJECT('stage', 'NODUE', 'delay', 'NA')
        END
    ) as paymentStageInfo,
    gpda.netPayable as totalAmount, 
    (
    	select IFNULL(sum(gir.totalAmount), 0) from stockmanagement.grn_item_returns gir where gir.grnId = gm.id and gir.supplierId = gm.supplierId
    ) as returnAmount,
    CASE 
        WHEN gpda.netPayable = 0 THEN 0
        ELSE gpda.netPayable - (
            SELECT IFNULL(SUM(gir.totalAmount), 0) 
            FROM stockmanagement.grn_item_returns gir 
            WHERE gir.grnId = gm.id AND gir.supplierId = gm.supplierId
        )
    END AS runningAmount,
    DATEDIFF(CAST(NOW() AS DATE), gm.date) AS totalDaysSince
    from
	stockmanagement.grn_master gm
	INNER JOIN stockmanagement.grn_payment_details_associations gpda on gpda.grnId = gm.id
	INNER JOIN stockmanagement.supplier_master sm on sm.id = gm.supplierId 
	 ORDER BY 
	  CASE 
        WHEN gm.status = 'DUE' THEN 1
        WHEN gm.status = 'PAID' THEN 2
        ELSE 3 
      END ASC, totalDaysSince DESC
`;

const prescribedPurchaseReportQuery = `
    select 
	(
	select
		JSON_OBJECT(
			'fullName', CONCAT(IFNULL(pm.firstName, ' '), ' ', IFNULL(pm.lastName, ' ')),
			'mobileNumber', pm.mobileNo,
			'aadhaarNumber', pm.aadhaarNo,
			'patientId', pm.patientId,
			'dob', pm.dateOfBirth,
            'photopath',pm.photoPath
		)
	from
		patient_master pm
	WHERE
		pm.id = pva.patientId) as patientDetails,
	caa.appointmentDate,
	TIME_FORMAT(caa.timeStart, '%H:%i') as timeStart ,
	TIME_FORMAT(caa.timeEnd, '%H:%i') as timeEnd ,
	(
	select
		cdm.name
	from
		consultation_doctor_master cdm
	where
		cdm.userId = caa.consultationDoctorId) as doctorName,
	'Consultation' as type,
	(
	select
		JSON_ARRAYAGG(
			JSON_OBJECT(
				'itemName', (select im.itemName from stockmanagement.item_master im where im.id = calba.billTypeValue),
				'purchaseQuantity', calba.purchaseQuantity ,
				'prescribedQuantity', calba.prescribedQuantity
			) 
		) 
	) as itemPurchaseDetails
    from
        consultation_appointment_line_bills_associations calba
    INNER JOIN consultation_appointments_associations caa on
        caa.id = calba.appointmentId
    INNER JOIN visit_consultations_associations vca on
        vca.id = caa.consultationId
    INNER JOIN patient_visits_association pva on
        pva.id = vca.visitId
    WHERE
        calba.billTypeId = 3
        and calba.status = 'PAID'
    GROUP by
        calba.appointmentId
    UNION
    select 
        (
        select
            JSON_OBJECT(
                'fullName', CONCAT(IFNULL(pm.firstName, ' '), ' ', IFNULL(pm.lastName, ' ')),
                'mobileNumber', pm.mobileNo,
                'aadhaarNumber', pm.aadhaarNo,
                'patientId', pm.patientId,
                'dob', pm.dateOfBirth,
                'photopath',pm.photoPath
            )
        from
            patient_master pm
        WHERE
            pm.id = pva.patientId) as patientDetails,
        taa.appointmentDate,
        TIME_FORMAT(taa.timeStart, '%H:%i') as timeStart ,
        TIME_FORMAT(taa.timeEnd, '%H:%i') as timeEnd ,
        (
        select
            cdm.name
        from
            consultation_doctor_master cdm
        where
            cdm.userId = taa.consultationDoctorId) as doctorName,
        'Treatment' as type,
        (
        select
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'itemName', (select im.itemName from stockmanagement.item_master im where im.id = talba.billTypeValue),
                    'purchaseQuantity', talba.purchaseQuantity ,
                    'prescribedQuantity', talba.prescribedQuantity
                ) 
            ) 
        ) as itemPurchaseDetails
    from
        treatment_appointment_line_bills_associations talba 
    INNER JOIN treatment_appointments_associations taa  on
        taa.id = talba.appointmentId
    INNER JOIN visit_treatment_cycles_associations vtca on
        vtca.id = taa.treatmentCycleId
    INNER JOIN patient_visits_association pva on
        pva.id = vtca.visitId
    WHERE
        talba.billTypeId = 3
        and talba.status = 'PAID'
    GROUP by
        talba.appointmentId
`;

const stockExpiryReportQuery = `
    with expiryDuration as (
	select gia.id, DATEDIFF(gia.expiryDate, CAST(NOW() as DATE)) as duration from stockmanagement.grn_items_associations gia 
    )
    select (select im.itemName from stockmanagement.item_master im where im.id = gia.itemId) as itemName,
    gia.batchNo, 
    (select gia.totalQuantity * gia.ratePerTablet) as rate,
    gia.ratePerTablet ,
    gia.expiryDate,
    gm.grnNo,
    gia.totalQuantity  as totalStockLeft,
    (
        CASE 
            WHEN ed.duration < 0 THEN 'NA'
            ELSE ed.duration
        END
        
    ) as daysToExpire,
    (
        CASE 
            WHEN ed.duration <0 THEN ABS(ed.duration)
            ELSE 'NA'
        END	
    ) as daysSinceExpire,
    	(
   		CASE
   			WHEN ed.duration < 7  THEN '1'
   			ELSE 0
   		END
   	) as showRedFlag
    from 
    stockmanagement.grn_items_associations gia 
    INNER JOIN expiryDuration ed on ed.id = gia.id
    INNER JOIN stockmanagement.grn_master gm on gm.id = gia.grnId
    order by gia.expiryDate ASC;
`;

const salesReportQuery = `
    SELECT
	JSON_ARRAYAGG(
        JSON_OBJECT(
            'productType', productType,
            'amount', CEIL(total_amount)
        )
    ) AS totalSalesProductTypeWise,
	CEIL(SUM(total_amount)) as totalSales,
	(
	select
		sum(pppr.totalAmount)
	from
		stockmanagement.patient_pharamacy_purchase_returns pppr INNER JOIN patient_master pm on pm.patientId = pppr.patientId
	where
		DATE(pppr.returnedDate) BETWEEN :fromDate AND :toDate AND pm.branchId = :branchId
    ) AS totalReturns
FROM
	(
	SELECT
		combinedQuery.productType,
		SUM(combinedQuery.total_amount) AS total_amount
	FROM
		(
		select
			odm.productType,
			SUM(odm.paidOrderAmount) as total_amount
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
			AND odm.paymentStatus = 'PAID'
			AND DATE(odm.orderDate) BETWEEN :fromDate AND :toDate
			AND 
 			(
				select
					pm.branchId
				from
					patient_master pm
				WHERE
					pm.id = pva.patientId) = :branchId
			GROUP by
				odm.productType
		UNION ALL
			select
				odm.productType,
				SUM(odm.paidOrderAmount) as total_amount
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
				AND odm.paymentStatus = 'PAID'
				AND DATE(odm.orderDate) BETWEEN :fromDate AND :toDate
				AND 
 				(
					select
						pm.branchId
					from
						patient_master pm
					WHERE
						pm.id = pva.patientId) = :branchId
				GROUP by
					odm.productType
        UNION ALL 
		    SELECT
				'Milestone' as productType, -- for advance payments also included in the milestone
				SUM(opom.paidOrderAmount) as total_amount
			FROM
				other_payment_orders_master opom
			INNER JOIN patient_other_payment_associations popa on popa.id = opom.refId
			WHERE 
                DATE(opom.orderDate) BETWEEN :fromDate AND :toDate
                AND opom.paymentStatus = 'PAID' 
                AND (
                    select
                        pm.branchId
                    from
                        patient_master pm
                    WHERE
                        pm.id = popa.patientId) = :branchId
                GROUP by
                    opom.refId
        UNION ALL 
		 	SELECT
                treatmentPayments.productType,
                SUM(treatmentPayments.paidOrderAmount) AS total_amount
                FROM (
                    SELECT
                        (CASE
                            WHEN tom.productType LIKE 'APPOINTMENT%' THEN 'Appointments'
                            ELSE 'Milestone'
                        END) AS productType,
                        tom.paidOrderAmount
                    FROM treatment_orders_master tom
                    INNER JOIN patient_visits_association pva ON pva.id = tom.visitId
                    WHERE DATE(tom.orderDate) BETWEEN :fromDate AND :toDate
                    AND (
                        SELECT pm.branchId FROM patient_master pm WHERE pm.id = pva.patientId
                    ) = :branchId
                ) AS treatmentPayments 
                GROUP BY treatmentPayments.productType
            ) as combinedQuery
	GROUP BY
		combinedQuery.productType
    ) AS subquery;
`;

const salesDataQuery = `
    select
	JSON_OBJECT(
        'patientName',(select CONCAT(IFNULL(pm.firstName, ''), ' ', IFNULL(pm.lastName, '')) from patient_master pm where pm.id = pva.patientId),
        'patientId', (select pm.patientId from patient_master pm where pm.id = pva.patientId),
        'branchId', (select pm.branchId from patient_master pm where pm.id = pva.patientId),
        'branch',(select name from branch_master bm where bm.id = (select pm.branchId from patient_master pm where pm.id = pva.patientId)),
        'orderId', odm.orderId ,
        'type', odm.type ,
        'date', DATE(odm.orderDate),
        'paymentMode', odm.paymentMode ,
        'totalOrderAmount', odm.totalOrderAmount ,
        'discountAmount', odm.discountAmount,
        'amount', odm.paidOrderAmount ,
        'productType', odm.productType ) as orderDetails
    from
        order_details_master odm
    INNER JOIN consultation_appointments_associations caa on
        caa.id = odm.appointmentId
    INNER JOIN visit_consultations_associations vca on
        vca.id = caa.consultationId
    INNER JOIN patient_visits_association pva on
        pva.id = vca.visitId
    where
        DATE(odm.orderDate) BETWEEN :fromDate AND :toDate
        and odm.appointmentId IS NOT NULL
        AND odm.paymentStatus = 'PAID'
        AND odm.type = 'Consultation'
        AND EXISTS (
        SELECT 1
        FROM patient_master pm
        WHERE pm.id = pva.patientId
          AND pm.branchId = :branchId)
    UNION ALL
    select
        JSON_OBJECT(
            'patientName',(select CONCAT(IFNULL(pm.firstName, ''), ' ', IFNULL(pm.lastName, '')) from patient_master pm where pm.id = pva.patientId),
            'patientId', (select pm.patientId from patient_master pm where pm.id = pva.patientId),
            'branchId', (select pm.branchId from patient_master pm where pm.id = pva.patientId),
            'branch',(select name from branch_master bm where bm.id = (select pm.branchId from patient_master pm where pm.id = pva.patientId)),
            'orderId', odm.orderId ,
            'type', odm.type ,
            'date', DATE(odm.orderDate),
            'paymentMode', odm.paymentMode ,
            'totalOrderAmount', odm.totalOrderAmount ,
            'discountAmount', odm.discountAmount,
            'amount', odm.paidOrderAmount ,
            'productType', odm.productType 
        ) as orderDetails
    from
        order_details_master odm
    INNER JOIN treatment_appointments_associations taa on
        taa.id = odm.appointmentId
    INNER JOIN visit_treatment_cycles_associations vtca on
        vtca.id = taa.treatmentCycleId
    INNER JOIN patient_visits_association pva on
        pva.id = vtca.visitId
    where
        DATE(odm.orderDate) BETWEEN :fromDate AND :toDate
        and odm.appointmentId IS NOT NULL
        AND odm.paymentStatus = 'PAID'
        AND odm.type = 'Treatment'
        AND EXISTS (
        SELECT 1
        FROM patient_master pm
        WHERE pm.id = pva.patientId
          AND pm.branchId = :branchId
    )
    UNION ALL
    SELECT 
    	JSON_OBJECT(
            'patientName', CONCAT(IFNULL(pm.firstName, ''), ' ', IFNULL(pm.lastName, '')),
            'patientId',  pm.patientId ,
            'branchId', pm.branchId,
            'branch',(select name from branch_master bm where bm.id = pm.branchId),
            'orderId', opom.orderId ,
            'type', opom.type ,
            'date', DATE(opom.orderDate),
            'paymentMode', opom.paymentMode ,
            'totalOrderAmount', opom.totalOrderAmount ,
            'discountAmount', opom.discountAmount,
            'amount', opom.paidOrderAmount ,
            'productType', popa.appointmentReason 
        ) as orderDetails
        FROM 
            other_payment_orders_master opom 
        INNER JOIN patient_other_payment_associations popa on 
            popa.id = opom.refId
        INNER JOIN patient_master pm on 
            pm.id = popa.patientId
        WHERE opom.paymentStatus  = 'PAID'
        AND pm.branchId  = :branchId
        AND DATE(opom.orderDate) BETWEEN :fromDate AND :toDate
    UNION ALL
   	select  
        JSON_OBJECT(
            'patientName',(select CONCAT(IFNULL(pm.firstName, ''), ' ', IFNULL(pm.lastName, '')) from patient_master pm where pm.id = pva.patientId),
            'patientId', (select pm.patientId from patient_master pm where pm.id = pva.patientId),
            'branchId', (select pm.branchId from patient_master pm where pm.id = pva.patientId),
            'branch',(select name from branch_master bm where bm.id = (select pm.branchId from patient_master pm where pm.id = pva.patientId)),
            'orderId', tom.orderId ,
            'type', tom.type ,
            'date', DATE(tom.orderDate),
            'paymentMode', tom.paymentMode ,
            'totalOrderAmount', tom.totalOrderAmount ,
            'discountAmount', tom.discountAmount,
            'amount', tom.paidOrderAmount ,
            'productType', (
            	CASE 
            		WHEN tom.productType LIKE 'APPOINTMENT%' THEN (
						select
							arm.name
						from
							treatment_appointments_associations taa
						INNER JOIN appointment_reason_master arm on
							arm.id = taa.appointmentReasonId
						where
							taa.id = SUBSTRING(tom.productType, 13) 
            		)
            		ELSE tom.productType 
            	END
            )
        ) as orderDetails 
    from treatment_orders_master tom 
    INNER JOIN patient_visits_association pva on pva.id = tom.visitId 
    where
        DATE(tom.orderDate) BETWEEN :fromDate AND :toDate
        AND EXISTS (
        SELECT 1
            FROM patient_master pm
            WHERE pm.id = pva.patientId
        AND pm.branchId = :branchId
    )
`;

const returnsDataQuery = `
    select
	JSON_OBJECT(
        'patientName',(select CONCAT(IFNULL(pm.firstName, ''), ' ', IFNULL(pm.lastName, '')) from patient_master pm where pm.id = pva.patientId),
        'patientId', (select pm.patientId from patient_master pm where pm.id = pva.patientId),
        'branchId', (select pm.branchId from patient_master pm where pm.id = pva.patientId),
        'branch',(select name from branch_master bm where bm.id = (select pm.branchId from patient_master pm where pm.id = pva.patientId)),
        'orderId', odm.orderId ,
        'type', odm.type ,
        'date', DATE(pppr.returnedDate),
        'amount', pppr.totalAmount  ,
        'productType', odm.productType ) as orderDetails
    from
        stockmanagement.patient_pharamacy_purchase_returns pppr INNER JOIN
        order_details_master odm ON pppr.orderId  = odm.orderId 
    INNER JOIN consultation_appointments_associations caa on
        caa.id = odm.appointmentId
    INNER JOIN visit_consultations_associations vca on
        vca.id = caa.consultationId
    INNER JOIN patient_visits_association pva on
        pva.id = vca.visitId
    where
        DATE(pppr.returnedDate) BETWEEN :fromDate AND :toDate
        AND odm.type = 'Consultation'
        AND EXISTS (
        SELECT 1
        FROM patient_master pm
        WHERE pm.id = pva.patientId
          AND pm.branchId = :branchId
    )
    UNION ALL
    select
        JSON_OBJECT(
            'patientName',(select CONCAT(IFNULL(pm.firstName, ''), ' ', IFNULL(pm.lastName, '')) from patient_master pm where pm.id = pva.patientId),
            'patientId', (select pm.patientId from patient_master pm where pm.id = pva.patientId),
            'branchId', (select pm.branchId from patient_master pm where pm.id = pva.patientId),
            'branch',(select name from branch_master bm where bm.id = (select pm.branchId from patient_master pm where pm.id = pva.patientId)),
            'orderId', odm.orderId ,
            'type', odm.type ,
            'date', DATE(pppr.returnedDate),
            'amount', pppr.totalAmount ,
            'productType', odm.productType 
    ) as orderDetails
    from
        stockmanagement.patient_pharamacy_purchase_returns pppr INNER JOIN
        order_details_master odm ON pppr.orderId  = odm.orderId 
    INNER JOIN treatment_appointments_associations taa on
        taa.id = odm.appointmentId
    INNER JOIN visit_treatment_cycles_associations vtca on
        vtca.id = taa.treatmentCycleId
    INNER JOIN patient_visits_association pva on
        pva.id = vtca.visitId
    where
        DATE(pppr.returnedDate) BETWEEN :fromDate AND :toDate
        AND odm.type = 'Treatment'
        AND EXISTS (
        SELECT 1
        FROM patient_master pm
        WHERE pm.id = pva.patientId
          AND pm.branchId = :branchId
    );
`;
const patientPharmacySalesReportQuery = `
SELECT 
    odm.orderId,
    CONCAT(pm.lastName, ' ', pm.firstName) AS patientName,
    pm.patientId AS patientId,
    odm.totalOrderAmount as totalAmount,
    COALESCE(pppr.returnAmount, 0) AS returnAmount,  
    odm.paymentMode
FROM 
    order_details_master odm
INNER JOIN 
    consultation_appointment_line_bills_associations calba ON calba.appointmentId = odm.appointmentId
INNER JOIN 
    consultation_appointments_associations caa ON caa.id = calba.appointmentId
INNER JOIN 
    visit_consultations_associations vca ON caa.consultationId = vca.id
INNER JOIN 
    patient_visits_association pva ON pva.id = vca.visitId
INNER JOIN 
    patient_master pm ON pm.id = pva.patientId
LEFT JOIN 
    (
        SELECT 
            orderId,
            SUM(totalAmount) AS returnAmount
        FROM 
            stockmanagement.patient_pharamacy_purchase_returns
        GROUP BY 
            orderId
    ) pppr ON pppr.orderId = odm.orderId
WHERE 
    odm.productType = 'PHARMACY'
GROUP BY 
    odm.orderId,
    pm.patientId,
    pm.firstName,
    pm.lastName,
    odm.totalOrderAmount,
    pppr.returnAmount,
    odm.paymentMode;
`;

const grnSalesReportQuery = `SELECT 
gm.id,
sm.supplier,
gm.grnNo,
gpm.orderId AS invoiceId,
gpm.paymentDate AS invoiceDate, 
ROUND(SUM(CASE WHEN gia.taxPercentage = 12 THEN gia.rate ELSE 0 END), 2) AS Tax12Gross,
ROUND(SUM(CASE WHEN gia.taxPercentage = 12 THEN gia.rate * (gia.taxPercentage / 100) ELSE 0 END), 2) AS Tax12Amount,
ROUND(SUM(CASE WHEN gia.taxPercentage = 5 THEN gia.rate ELSE 0 END), 2) AS Tax5Gross,
ROUND(SUM(CASE WHEN gia.taxPercentage = 5 THEN gia.rate * (gia.taxPercentage / 100) ELSE 0 END), 2) AS Tax5Amount,
ROUND(SUM(CASE WHEN gia.taxPercentage = 18 THEN gia.rate ELSE 0 END), 2) AS Tax18Gross,
ROUND(SUM(CASE WHEN gia.taxPercentage = 18 THEN gia.rate * (gia.taxPercentage / 100) ELSE 0 END), 2) AS Tax18Amount,
ROUND(SUM(CASE WHEN gia.taxPercentage = 28 THEN gia.rate ELSE 0 END), 2) AS Tax28Gross,
ROUND(SUM(CASE WHEN gia.taxPercentage = 28 THEN gia.rate * (gia.taxPercentage / 100) ELSE 0 END), 2) AS Tax28Amount,
ROUND(SUM(gia.discountAmount), 2) AS discount,
ROUND(
    (SUM(CASE WHEN gia.taxPercentage = 12 THEN gia.rate ELSE 0 END) + 
    SUM(CASE WHEN gia.taxPercentage = 12 THEN gia.rate * (gia.taxPercentage / 100) ELSE 0 END) + 
    SUM(CASE WHEN gia.taxPercentage = 5 THEN gia.rate ELSE 0 END) + 
    SUM(CASE WHEN gia.taxPercentage = 5 THEN gia.rate * (gia.taxPercentage / 100) ELSE 0 END) + 
    SUM(CASE WHEN gia.taxPercentage = 18 THEN gia.rate ELSE 0 END) + 
    SUM(CASE WHEN gia.taxPercentage = 18 THEN gia.rate * (gia.taxPercentage / 100) ELSE 0 END) + 
    SUM(CASE WHEN gia.taxPercentage = 28 THEN gia.rate ELSE 0 END) + 
    SUM(CASE WHEN gia.taxPercentage = 28 THEN gia.rate * (gia.taxPercentage / 100) ELSE 0 END) - 
    SUM(gia.discountAmount)), 2
) AS TotalGRN
FROM 
stockmanagement.grn_master gm 
INNER JOIN 
stockmanagement.grn_items_associations gia ON gm.id = gia.grnId
INNER JOIN 
stockmanagement.supplier_master sm ON sm.id = gm.supplierId 
INNER JOIN
stockmanagement.grn_payments_master gpm ON gpm.grnNo = gm.grnNo
GROUP BY  
gm.grnNo;
`;

const getStockReportQuery = `
WITH itemQuantity AS (
    SELECT
        im.id,
        COALESCE(SUM(gia.totalQuantity), 0) AS totalQuantity
    FROM
        stockmanagement.item_master im
    LEFT JOIN stockmanagement.grn_items_associations gia 
        ON gia.itemId = im.id AND gia.isReturned = 0
    LEFT JOIN stockmanagement.grn_master gm 
        ON gm.id = gia.grnId 
    WHERE
        im.isActive = 1  AND gm.branchId IN (:branchId)
    GROUP BY 
        im.id
),
itemInformation AS (
    SELECT
        im.id, 
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'grnId', gia.grnId,
                'supplierName', (SELECT sm.supplier FROM stockmanagement.supplier_master sm WHERE sm.id = gm.supplierId),
                'availableQuantity', gia.totalQuantity,
                'branchId', gm.branchId,
                'expiryDate', gia.expiryDate,
                'branchName', (select bm.name from branch_master bm where bm.id = gm.branchId) 
            )
        ) AS grnDetails
    FROM
        stockmanagement.item_master im
    LEFT JOIN stockmanagement.grn_items_associations gia 
        ON gia.itemId = im.id AND gia.isReturned = 0
    LEFT JOIN stockmanagement.grn_master gm 
        ON gm.id = gia.grnId 
    WHERE
        im.isActive = 1  AND gm.branchId IN (:branchId)
    GROUP BY 
        im.id
)
SELECT
    im.id AS itemId,
    im.itemName, 
    COALESCE(iq.totalQuantity, 0) AS totalQuantity,
    CASE 
        WHEN iq.totalQuantity = 0 OR iq.totalQuantity IS NULL THEN JSON_ARRAY()
        ELSE ii.grnDetails
    END AS grnDetails
FROM
    stockmanagement.item_master im
LEFT JOIN itemQuantity iq ON iq.id = im.id
LEFT JOIN itemInformation ii ON ii.id = im.id
WHERE
    im.isActive = 1
ORDER BY
    totalQuantity ASC;
`;

const getItemPurchaseHistoryQuery = `
select
	*
from
	(
	select
		(
		select
			im.itemName
		from
			stockmanagement.item_master im
		where
			im.id = calba.billTypeValue) as itemName,
		calba.purchaseQuantity,
		caa.appointmentDate ,
		(
		select
			arm.name
		from
			appointment_reason_master arm
		where
			arm.id = caa.appointmentReasonId) as appointmentReason,
		'Consultation' as type,
		odm.orderId ,
		CAST(odm.orderDate as DATE) as orderDate ,
		odm.paymentMode,
		pm.patientId ,
		CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) as patientName,
		pm.mobileNo,
		(
		select
			cdm.name
		from
			consultation_doctor_master cdm
		where
			cdm.userId = caa.consultationDoctorId) as prescribedBy
	from
		consultation_appointment_line_bills_associations calba
	INNER JOIN consultation_appointments_associations caa on
		caa.id = calba.appointmentId
	INNER JOIN visit_consultations_associations vca on
		vca.id = caa.consultationId
	INNER JOIN patient_visits_association pva on
		pva.id = vca.visitId
	LEFT JOIN order_details_master odm on
		odm.appointmentId = caa.id
	INNER JOIN patient_master pm on
		pm.id = pva.patientId
	WHERE
		calba.status = 'PAID'
		and odm.type = 'Consultation'
		and odm.productType = 'PHARMACY'
		and calba.billTypeId = 3
		and calba.billTypeValue = :itemId
UNION ALL
	select
		(
		select
			im.itemName
		from
			stockmanagement.item_master im
		where
			im.id = talba.billTypeValue) as itemName,
		talba.purchaseQuantity,
		taa.appointmentDate ,
		(
		select
			arm.name
		from
			appointment_reason_master arm
		where
			arm.id = taa.appointmentReasonId) as appointmentReason,
		'Treatment' as type,
		odm.orderId ,
		CAST(odm.orderDate as DATE) as orderDate ,
		odm.paymentMode,
		pm.patientId ,
		CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) as patientName,
		pm.mobileNo,
		(
		select
			cdm.name
		from
			consultation_doctor_master cdm
		where
			cdm.userId = taa.consultationDoctorId) as prescribedBy
	from
		treatment_appointment_line_bills_associations talba
	INNER JOIN treatment_appointments_associations taa on
		taa.id = talba.appointmentId
	INNER JOIN visit_treatment_cycles_associations vtca on
		vtca.id = taa.treatmentCycleId
	INNER JOIN patient_visits_association pva on
		pva.id = vtca.visitId
	LEFT JOIN order_details_master odm on
		odm.appointmentId = taa.id
	INNER JOIN patient_master pm on
		pm.id = pva.patientId
	WHERE
		talba.status = 'PAID'
		and odm.type = 'Treatment'
		and odm.productType = 'PHARMACY'
		and talba.billTypeId = 3
		and talba.billTypeValue = :itemId
) itemPurchaseReport
ORDER BY
	orderDate desc

`;

const noShowReportQuery = `
SELECT * FROM (
    SELECT 
        pm.patientId,
        CONCAT(pm.lastName, ' ', pm.firstName) AS patientName,
        bm.branchCode AS branch, 
        caa.id AS appointmentId,
        'Consultation' AS type,
        arm.name AS appointmentReason,
        caa.appointmentDate,
        caa.noShow,
        caa.noShowReason 
    FROM patient_master pm 
    INNER JOIN patient_visits_association pva ON pva.patientId = pm.id 
    INNER JOIN visit_consultations_associations vca ON vca.visitId = pva.id 
    INNER JOIN consultation_appointments_associations caa ON caa.consultationId = vca.id
    INNER JOIN appointment_reason_master arm ON caa.appointmentReasonId = arm.id
    INNER JOIN branch_master bm ON bm.id = pm.branchId 
    WHERE caa.noShow = 1

    UNION 
    
    SELECT 
        pm.patientId,
        CONCAT(pm.lastName, ' ', pm.firstName) AS patientName,
        bm.branchCode AS branch, 
        taa.id AS appointmentId,
        'Treatment' AS type,
        arm.name AS appointmentReason,
        taa.appointmentDate,
        taa.noShow,
        taa.noShowReason 
    FROM patient_master pm 
    INNER JOIN patient_visits_association pva ON pva.patientId = pm.id 
    INNER JOIN visit_treatment_cycles_associations vtca ON vtca.visitId = pva.id 
    INNER JOIN treatment_appointments_associations taa ON taa.treatmentCycleId = vtca.id
    INNER JOIN appointment_reason_master arm ON taa.appointmentReasonId = arm.id
    INNER JOIN branch_master bm ON bm.id = pm.branchId 
    WHERE taa.noShow = 1
) AS combined_results
ORDER BY appointmentDate DESC;
`;

const treatmentCycleHistoryQuery = `
SELECT
    pm.patientId,
	CONCAT(pm.lastName,' ', COALESCE(pm.firstName)) as patientName, 
	COALESCE(pga.name,'-') as spouseName,
	(SELECT vtm.name from visit_type_master vtm where vtm.id = pva.type) as visitType,
	ttm.name as treatmentType,
	ttm.isPackageExists,
	pva.id as visitId
FROM
	patient_master pm
LEFT JOIN patient_guardian_associations pga ON pga.patientId = pm.id
INNER JOIN patient_visits_association pva  ON pm.id = pva.patientId and pva.isActive = 1
LEFT JOIN visit_packages_associations vpa ON vpa.visitId  = pva.id
INNER JOIN visit_treatment_cycles_associations vtca on vtca.visitId  = pva.id
INNER JOIN treatment_type_master ttm ON ttm.id = vtca.treatmentTypeId
`;

const patientReportQuery = `
SELECT 
    DATE_FORMAT(COALESCE(pva.visitDate, pm.createdAt), '%d-%b-%Y') AS date,
    bm.branchCode AS branch,
    CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) AS patientName,
    pm.patientId AS patientNumber,
    CONCAT(
        COALESCE(rtm.name, ''), 
        CASE WHEN pm.referralName IS NOT NULL AND pm.referralName != '' 
            THEN CONCAT(' - ', pm.referralName) 
            ELSE '' 
        END
    ) AS referralSource,
    'N/A' AS plan,
    COALESCE(ttm.name, 'N/A') AS treatmentType,
    'N/A' AS package,
    COALESCE(vtca.cycleNumber, 1) AS cycle,
    CASE 
        WHEN pva.id IS NULL THEN 'On Hold'
        WHEN pva.isActive = 1 AND (vpa.uptPositiveDate IS NULL OR vpa.uptPositiveDate = '') THEN 'Active'
        WHEN vpa.uptPositiveDate IS NOT NULL AND vpa.uptPositiveDate != '' THEN 'Completed'
        WHEN pva.isActive = 0 THEN 'Dropped'
        ELSE 'On Hold'
    END AS status,
    COALESCE(paymentData.paidAmount, 0) AS paidAmount,
    COALESCE(paymentData.pendingAmount, 0) AS pendingAmount,
    COALESCE(embryoData.totalEmbryos, 0) AS noOfEmbryos,
    COALESCE(embryoData.usedEmbryos, 0) AS noOfEmbryosUsed,
    COALESCE(embryoData.remainingEmbryos, 0) AS noOfEmbryosRemaining,
    CASE 
        WHEN vpa.registrationDate IS NOT NULL THEN DATE_FORMAT(vpa.registrationDate, '%d-%b-%Y')
        ELSE 'N/A'
    END AS lastRenewalDate,
    COALESCE(embryoData.discardedEmbryos, 0) AS noOfEmbryosDiscarded,
    CASE 
        WHEN vpa.uptPositiveDate IS NOT NULL AND vpa.uptPositiveDate != '' THEN 'Positive'
        WHEN pva.id IS NULL THEN 'Pending'
        WHEN vpa.uptPositiveDate IS NULL OR vpa.uptPositiveDate = '' THEN 
            CASE WHEN pva.isActive = 0 THEN 'Negative' ELSE 'Pending' END
        ELSE 'Pending'
    END AS uptResult,
    pm.id AS patientId,
    pva.id AS visitId,
    vtca.id AS treatmentCycleId
FROM patient_master pm
INNER JOIN branch_master bm ON bm.id = pm.branchId
LEFT JOIN patient_visits_association pva ON pva.patientId = pm.id AND pva.isActive = 1
LEFT JOIN visit_treatment_cycles_associations vtca ON vtca.visitId = pva.id
LEFT JOIN treatment_type_master ttm ON ttm.id = vtca.treatmentTypeId
LEFT JOIN visit_packages_associations vpa ON vpa.visitId = pva.id
LEFT JOIN referral_type_master rtm ON rtm.id = pm.referralId
LEFT JOIN (
    SELECT 
        COALESCE(pva2.visitId, vca.visitId) AS visitId,
        SUM(CASE WHEN odm.paymentStatus = 'PAID' THEN odm.paidOrderAmount ELSE 0 END) AS paidAmount,
        SUM(CASE WHEN odm.paymentStatus = 'DUE' THEN odm.totalOrderAmount ELSE 0 END) AS pendingAmount
    FROM order_details_master odm
    LEFT JOIN consultation_appointments_associations caa ON caa.id = odm.appointmentId AND odm.type = 'CONSULTATION'
    LEFT JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
    LEFT JOIN treatment_appointments_associations taa ON taa.id = odm.appointmentId AND odm.type = 'TREATMENT'
    LEFT JOIN visit_treatment_cycles_associations vtca2 ON vtca2.id = taa.treatmentCycleId
    LEFT JOIN patient_visits_association pva2 ON pva2.id = vtca2.visitId
    WHERE odm.appointmentId IS NOT NULL
    GROUP BY COALESCE(pva2.visitId, vca.visitId)
) AS paymentData ON paymentData.visitId = pva.id
LEFT JOIN (
    SELECT 
        vtca3.id AS treatmentCycleId,
        COUNT(DISTINCT tea.id) AS totalEmbryos,
        SUM(CASE WHEN tea.categoryType LIKE '%used%' OR tea.categoryType LIKE '%transferred%' OR tea.categoryType LIKE '%transfer%' THEN 1 ELSE 0 END) AS usedEmbryos,
        SUM(CASE WHEN tea.categoryType LIKE '%frozen%' OR tea.categoryType LIKE '%remaining%' OR tea.categoryType LIKE '%freeze%' THEN 1 ELSE 0 END) AS remainingEmbryos,
        SUM(CASE WHEN tea.categoryType LIKE '%discarded%' OR tea.categoryType LIKE '%disposed%' OR tea.categoryType LIKE '%discard%' THEN 1 ELSE 0 END) AS discardedEmbryos
    FROM visit_treatment_cycles_associations vtca3
    LEFT JOIN treatement_embryology_association tea ON tea.treatmentCycleId = vtca3.id
    GROUP BY vtca3.id
) AS embryoData ON embryoData.treatmentCycleId = vtca.id
WHERE 1=1
{{whereConditions}}
GROUP BY 
    pm.id, 
    pva.id, 
    vtca.id,
    bm.branchCode,
    rtm.name,
    pm.referralName,
    ttm.name,
    vpa.registrationDate,
    vpa.uptPositiveDate,
    pva.isActive,
    pva.visitDate,
    pm.createdAt,
    paymentData.paidAmount,
    paymentData.pendingAmount,
    embryoData.totalEmbryos,
    embryoData.usedEmbryos,
    embryoData.remainingEmbryos,
    embryoData.discardedEmbryos
ORDER BY pm.createdAt DESC, COALESCE(vtca.createdAt, pva.createdAt) DESC
{{pagination}}
`;

module.exports = {
  appointmentStageDurationReportQuery,
  grnVendorPaymentReportsQuery,
  prescribedPurchaseReportQuery,
  stockExpiryReportQuery,
  salesReportQuery,
  salesDataQuery,
  returnsDataQuery,
  patientPharmacySalesReportQuery,
  grnSalesReportQuery,
  getStockReportQuery,
  getItemPurchaseHistoryQuery,
  noShowReportQuery,
  treatmentCycleHistoryQuery,
  patientReportQuery
};
