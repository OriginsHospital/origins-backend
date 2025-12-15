const invoiceForConsultationAppointmentsQuery = `
select CAST(NOW() as DATE) as currentDate,
    JSON_OBJECT(
        'orderNo', odm.orderId ,
        'transactionNo', IFNULL(odm.transactionId,'') ,
        'paymentStatus', odm.paymentStatus ,
        'paymentMode', odm.paymentMode,
        'isOnlineMode', CASE WHEN odm.paymentMode IN ('ONLINE', 'UPI') THEN TRUE ELSE FALSE END,
        'isCashMode', CASE WHEN odm.paymentMode = 'CASH' THEN TRUE ELSE FALSE END,
        'orderDate', CAST(odm.orderDate as DATE)
    ) as orderDetails,
    JSON_OBJECT(
        'totalAmount', odm.totalOrderAmount ,
        'paidAmount', odm.paidOrderAmount,
        'discount', odm.discountAmount,
        'gst', 0
    ) as paymentBreakUp
    from 
    order_details_master odm 
    INNER JOIN consultation_appointments_associations caa  on caa.id = odm.appointmentId 
    INNER JOIN appointment_reason_master arm on arm.id = caa.appointmentReasonId
    INNER JOIN visit_consultations_associations vca on vca.id = caa.consultationId 
    INNER JOIN patient_visits_association pva on pva.id = vca.visitId 
    INNER JOIN patient_master pm on pm.id = pva.patientId 
    LEFT  JOIN patient_guardian_associations pga on pga.patientId  = pm.id
    where odm.appointmentId  = :appointmentId and odm.productType = :productType and odm.type = 'Consultation'
`;
const invoiceForTreatementAppointmentsQuery = `
select CAST(NOW() as DATE) as currentDate,
    JSON_OBJECT(
        'orderNo', odm.orderId ,
        'transactionNo', IFNULL(odm.transactionId,'') ,
        'paymentStatus', odm.paymentStatus ,
        'paymentMode', odm.paymentMode,
        'isOnlineMode', CASE WHEN odm.paymentMode IN ('ONLINE', 'UPI') THEN TRUE ELSE FALSE END,
        'isCashMode', CASE WHEN odm.paymentMode = 'CASH' THEN TRUE ELSE FALSE END,
        'orderDate', CAST(odm.orderDate as DATE)
    ) as orderDetails,
    JSON_OBJECT(
        'totalAmount', odm.totalOrderAmount ,
        'paidAmount', odm.paidOrderAmount,
        'discount', odm.discountAmount,
        'gst', 0
    ) as paymentBreakUp
    from 
    order_details_master odm 
    INNER JOIN treatment_appointments_associations taa  on taa.id = odm.appointmentId 
    INNER JOIN appointment_reason_master arm on arm.id = taa.appointmentReasonId
    INNER JOIN visit_treatment_cycles_associations vtca on vtca.id = taa.treatmentCycleId  
    INNER JOIN patient_visits_association pva on pva.id = vtca.visitId 
    INNER JOIN patient_master pm on pm.id = pva.patientId 
    LEFT  JOIN patient_guardian_associations pga on pga.patientId  = pm.id
    where odm.appointmentId  =  :appointmentId and odm.productType = :productType and odm.type = 'Treatment'
`;

const invoiceForTreatmentOrdersMileStoneQuery = `
select CAST(NOW() as DATE) as currentDate,
    JSON_OBJECT(
        'orderNo', tom.orderId ,
        'transactionNo', IFNULL(tom.transactionId,'') ,
        'paymentStatus', tom.paymentStatus ,
        'paymentMode', tom.paymentMode,
        'isOnlineMode', CASE WHEN tom.paymentMode IN ('ONLINE', 'UPI') THEN TRUE ELSE FALSE END,
        'isCashMode', CASE WHEN tom.paymentMode = 'CASH' THEN TRUE ELSE FALSE END,
        'orderDate', CAST(tom.orderDate as DATE)
    ) as orderDetails,
    JSON_OBJECT(
        'totalAmount', tom.paidOrderAmountBeforeDiscount,
        'discount', tom.discountAmount,
        'paidAmount', tom.paidOrderAmount,
        'gst', 0
    ) as paymentBreakUp
    from 
    treatment_orders_master tom  
    INNER JOIN patient_visits_association pva on pva.id = tom.visitId 
    INNER JOIN patient_master pm on pm.id = pva.patientId
    LEFT JOIN patient_guardian_associations pga on pga.patientId = pm.id
    where tom.id  = :id and tom.productType = :productType
`;

const getAppointmentReasonForInvoiceQuery = `
WITH appointmentId AS (
    SELECT
        tom.productType,
        SUBSTRING(tom.productType, 13) AS appointmentId
    FROM
        treatment_orders_master tom
    WHERE
        tom.orderId = :orderId
)
SELECT 
    arm.name AS appointmentReason,
    arm.isSpouse
FROM treatment_appointments_associations taa 
INNER JOIN 
    appointmentId ai
ON 
    taa.id = ai.appointmentId
INNER JOIN 
    appointment_reason_master arm
ON 
    arm.id = taa.appointmentReasonId;
`;

const pharmacyConsultationProductTable = `
    select JSON_ARRAYAGG(
	JSON_OBJECT(
        'refId', calba.id,
		'itemName', (select im.itemName from stockmanagement.item_master im where im.id = calba.billTypeValue),
		'purchaseQuantity', calba.purchaseQuantity ,
		'prescribedQuantity', calba.prescribedQuantity,
        'prescriptionDetails', calba.prescriptionDetails,
        'prescribedTo', (CASE
                            WHEN calba.isSpouse = 0 THEN 'PATIENT'
                            WHEN calba.isSpouse = 1 THEN 'SPOUSE'
                        END)
	) 
    ) as itemInfo  from consultation_appointment_line_bills_associations calba 
    where calba.id IN (:refId)
    group by appointmentId ;
`;

const pharmacyTreatmentProductTable = `
    select JSON_ARRAYAGG(
	JSON_OBJECT(
        'refId', talba.id,
		'itemName', (select im.itemName from stockmanagement.item_master im where im.id = talba.billTypeValue),
		'purchaseQuantity', talba.purchaseQuantity ,
		'prescribedQuantity', talba.prescribedQuantity,
        'prescriptionDetails', talba.prescriptionDetails,
        'prescribedTo', (CASE
                            WHEN talba.isSpouse = 0 THEN 'PATIENT'
                            WHEN talba.isSpouse = 1 THEN 'SPOUSE'
                        END)
	) 
    ) as itemInfo  from treatment_appointment_line_bills_associations talba
    where talba.id IN (:refId)
    group by appointmentId ;
`;

const consultationOrderDetailsForInvoiceQuery = `
    SELECT 
    (
        CASE
            WHEN :productType = 'LAB TEST' THEN (
                SELECT 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'itemName', 
                            (SELECT ltm.name FROM lab_test_master ltm WHERE ltm.id = calba.billTypeValue),
                            'totalCost', 
                            (SELECT ltmba.amount FROM lab_test_master_branch_association ltmba WHERE ltmba.labTestId  = calba.billTypeValue and ltmba.branchId = caa.branchId),
                            'prescribedTo', 
                            (CASE 
                                WHEN calba.isSpouse = 0 THEN 'PATIENT'
                                WHEN calba.isSpouse = 1 THEN 'SPOUSE'
                            END)
                        )
                    )
                FROM consultation_appointment_line_bills_associations calba
                INNER JOIN consultation_appointments_associations caa ON calba.appointmentId  = caa.id
                INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
				INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
				INNER JOIN patient_master pm ON pm.id = pva.patientId
                WHERE calba.billTypeId = 1 AND calba.id IN (:refId)
            )
            WHEN :productType = 'SCAN' THEN (
                SELECT 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'itemName', 
                            (SELECT sm.name FROM scan_master sm WHERE sm.id = calba.billTypeValue),
                            'totalCost', 
                            (SELECT smba.amount FROM scan_master_branch_association smba WHERE smba.scanId = calba.billTypeValue and smba.branchId = caa.branchId LIMIT 1),
                            'prescribedTo', 
                            (CASE 
                                WHEN calba.isSpouse = 0 THEN 'PATIENT'
                                WHEN calba.isSpouse = 1 THEN 'SPOUSE'
                            END)
                        )
                    )
                FROM consultation_appointment_line_bills_associations calba
                INNER JOIN consultation_appointments_associations caa ON calba.appointmentId  = caa.id
                INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
				INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
				INNER JOIN patient_master pm ON pm.id = pva.patientId
                WHERE calba.billTypeId = 2 AND calba.id IN (:refId)
            )
            WHEN :productType = 'EMBRYOLOGY' THEN (
                SELECT 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'itemName', 
                            (SELECT em.name FROM embryology_master em WHERE em.id = calba.billTypeValue),
                            'totalCost', 
                            (SELECT emba.amount FROM embryology_master_branch_association emba WHERE emba.embryologyId  = calba.billTypeValue and emba.branchId = caa.branchId LIMIT 1),
                            'prescribedTo', 
                            (CASE 
                                WHEN calba.isSpouse = 0 THEN 'PATIENT'
                                WHEN calba.isSpouse = 1 THEN 'SPOUSE'
                            END)
                        )
                    )
                FROM consultation_appointment_line_bills_associations calba
                INNER JOIN consultation_appointments_associations caa ON calba.appointmentId  = caa.id
                INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
				INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
				INNER JOIN patient_master pm ON pm.id = pva.patientId
                WHERE calba.billTypeId = 4 AND calba.id IN (:refId)
            )
        END
    ) AS itemDetails
`;

const treatmentOrderDetailsForInvoiceQuery = `
SELECT 
    (
        CASE
            WHEN :productType = 'LAB TEST' THEN (
                SELECT 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'itemName', 
                            (SELECT ltm.name FROM lab_test_master ltm WHERE ltm.id = talba.billTypeValue),
                            'totalCost', 
                            (SELECT ltmba.amount FROM lab_test_master_branch_association ltmba WHERE ltmba.labTestId = talba.billTypeValue and ltmba.branchId = taa.branchId),
                            'prescribedTo', 
                            (CASE 
                                WHEN talba.isSpouse = 0 THEN 'PATIENT'
                                WHEN talba.isSpouse = 1 THEN 'SPOUSE'
                            END)
                        )
                    )
                 FROM treatment_appointment_line_bills_associations talba
                 INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId 
                 INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId
                 INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId 
                 INNER JOIN patient_master pm ON pm.id = pva.patientId
                WHERE talba.billTypeId = 1 AND talba.id IN (:refId)
            )
            WHEN :productType = 'SCAN' THEN (
                SELECT 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'itemName', 
                            (SELECT sm.name FROM scan_master sm WHERE sm.id = talba.billTypeValue),
                            'totalCost', 
                            (SELECT smba.amount FROM scan_master_branch_association smba WHERE smba.scanId  = talba.billTypeValue and smba.branchId = taa.branchId LIMIT 1),
                            'prescribedTo', 
                            (CASE 
                                WHEN talba.isSpouse = 0 THEN 'PATIENT'
                                WHEN talba.isSpouse = 1 THEN 'SPOUSE'
                            END)
                        )
                    )
                FROM treatment_appointment_line_bills_associations talba
                INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId 
                INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId
                INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId 
                INNER JOIN patient_master pm ON pm.id = pva.patientId
                WHERE talba.billTypeId = 2 AND talba.id IN (:refId)
            )
            WHEN :productType = 'EMBRYOLOGY' THEN (
                SELECT 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'itemName', 
                            (SELECT em.name FROM embryology_master em WHERE em.id = talba.billTypeValue),
                            'totalCost', 
                            (SELECT emba.amount FROM embryology_master_branch_association emba WHERE emba.embryologyId  = talba.billTypeValue and emba.branchId = taa.branchId),
                            'prescribedTo', 
                            (CASE 
                                WHEN talba.isSpouse = 0 THEN 'PATIENT'
                                WHEN talba.isSpouse = 1 THEN 'SPOUSE'
                            END)
                        )
                    )
                FROM treatment_appointment_line_bills_associations talba
                INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId 
                INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId
                INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId 
                INNER JOIN patient_master pm ON pm.id = pva.patientId
                WHERE talba.billTypeId = 4 AND talba.id IN (:refId)
            )
        END
    ) AS itemDetails
`;

const patientItemReturnConsultationQuery = `
SELECT 
    JSON_OBJECT(
        'patientName', CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')),
        'patientId', pm.patientId,
        'doctorName', (
            SELECT cdm.name 
            FROM consultation_doctor_master cdm 
            WHERE cdm.userId = caa.consultationDoctorId
        ),
        'gender', pm.gender,
        'dob', pm.dateOfBirth,
        'appointmentReason', (
            SELECT arm.name 
            FROM appointment_reason_master arm 
            WHERE arm.id = caa.appointmentReasonId
        ),
        'appointmentDate', caa.appointmentDate
    ) AS patientDetails,
    (
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'refId', refTable.refId,
                'itemId', calba.billTypeValue,
                'itemName', refTable.itemName, 
                'purchaseQuantity', calba.purchaseQuantity,
                'returnQuantity', calba.returnQuantity,
                'totalCost', refTable.totalCost,
                'purchaseDetails', purchaseTable.purchaseDetails
            )
        )
        FROM JSON_TABLE(
            odm.orderDetails, '$[*]' 
            COLUMNS (
                refId INT PATH '$.refId',
                itemName VARCHAR(100) PATH '$.itemName',
                totalCost DECIMAL(10,2) PATH '$.totalCost'
            )
        ) AS refTable
        INNER JOIN consultation_appointment_line_bills_associations calba 
            ON calba.id = refTable.refId
        INNER JOIN (
            SELECT 
                subTable.refId,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'expiryDate', subTable.expiryDate,
                        'grnId', gm.id,
                        'mrpPerTablet', subTable.mrpPerTablet,
                        'usedQuantity', subTable.usedQuantity,
                        'batchNo', gia.batchNo
                    )
                ) AS purchaseDetails
            FROM JSON_TABLE(
                odm.orderDetails, '$[*]' 
                COLUMNS (
                    refId INT PATH '$.refId',
                    NESTED PATH '$.purchaseDetails[*]' 
                    COLUMNS (
                        grnId INT PATH '$.grnId',
                        expiryDate DATE PATH '$.expiryDate',
                        initialUsedQuantity INT PATH '$.initialUsedQuantity',
                        mrpPerTablet DECIMAL(10,2) PATH '$.mrpPerTablet',
                        returnedQuantity INT PATH '$.returnedQuantity',
                        usedQuantity INT PATH '$.usedQuantity'
                    )
                )
            ) AS subTable
            INNER JOIN consultation_appointment_line_bills_associations calba 
                ON calba.id = subTable.refId
            INNER JOIN stockmanagement.grn_master gm 
                ON gm.id = subTable.grnId
            INNER JOIN stockmanagement.grn_items_associations gia 
                ON gia.grnId = gm.id AND gia.itemId = calba.billTypeValue
            GROUP BY subTable.refId
        ) AS purchaseTable 
        ON purchaseTable.refId = refTable.refId
    ) AS purchasedItems
FROM order_details_master odm
INNER JOIN consultation_appointments_associations caa 
    ON caa.id = odm.appointmentId
INNER JOIN visit_consultations_associations vca 
    ON vca.id = caa.consultationId
INNER JOIN patient_visits_association pva 
    ON pva.id = vca.visitId
INNER JOIN patient_master pm 
    ON pm.id = pva.patientId
WHERE 
    odm.productType = 'PHARMACY' AND 
    odm.type = 'Consultation' AND 
    odm.paymentStatus = 'PAID' AND 
    odm.orderId = :orderId;
`;

const patientItemReturnTreatementQuery = `
SELECT 
    JSON_OBJECT(
        'patientName', CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')),
        'patientId', pm.patientId,
        'doctorName', (
            SELECT cdm.name 
            FROM consultation_doctor_master cdm 
            WHERE cdm.userId = taa.consultationDoctorId
        ),
        'gender', pm.gender,
        'dob', pm.dateOfBirth,
        'appointmentReason', (
            SELECT arm.name 
            FROM appointment_reason_master arm 
            WHERE arm.id = taa.appointmentReasonId
        ),
        'appointmentDate', taa.appointmentDate
    ) AS patientDetails,
    (
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'refId', refTable.refId,
                'itemId', talba.billTypeValue,
                'itemName', refTable.itemName, 
                'purchaseQuantity', talba.purchaseQuantity,
                'returnQuantity', talba.returnQuantity,
                'totalCost', refTable.totalCost,
                'purchaseDetails', purchaseTable.purchaseDetails
            )
        )
        FROM JSON_TABLE(
            odm.orderDetails, '$[*]' 
            COLUMNS (
                refId INT PATH '$.refId',
                itemName VARCHAR(100) PATH '$.itemName',
                totalCost DECIMAL(10,2) PATH '$.totalCost'
            )
        ) AS refTable
        INNER JOIN treatment_appointment_line_bills_associations talba 
            ON talba.id = refTable.refId
        INNER JOIN (
            SELECT 
                subTable.refId,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'expiryDate', subTable.expiryDate,
                        'grnId', gm.id,
                        'mrpPerTablet', subTable.mrpPerTablet,
                        'usedQuantity', subTable.usedQuantity,
                        'batchNo', gia.batchNo
                    )
                ) AS purchaseDetails
            FROM JSON_TABLE(
                odm.orderDetails, '$[*]' 
                COLUMNS (
                    refId INT PATH '$.refId',
                    NESTED PATH '$.purchaseDetails[*]' 
                    COLUMNS (
                        grnId INT PATH '$.grnId',
                        expiryDate DATE PATH '$.expiryDate',
                        initialUsedQuantity INT PATH '$.initialUsedQuantity',
                        mrpPerTablet DECIMAL(10,2) PATH '$.mrpPerTablet',
                        returnedQuantity INT PATH '$.returnedQuantity',
                        usedQuantity INT PATH '$.usedQuantity'
                    )
                )
            ) AS subTable
            INNER JOIN treatment_appointment_line_bills_associations talba 
                ON talba.id = subTable.refId
            INNER JOIN stockmanagement.grn_master gm 
                ON gm.id = subTable.grnId
            INNER JOIN stockmanagement.grn_items_associations gia 
                ON gia.grnId = gm.id AND gia.itemId = talba.billTypeValue
            GROUP BY subTable.refId
        ) AS purchaseTable 
        ON purchaseTable.refId = refTable.refId
    ) AS purchasedItems
FROM order_details_master odm
INNER JOIN treatment_appointments_associations taa 
    ON taa.id = odm.appointmentId
INNER JOIN visit_treatment_cycles_associations vtca 
    ON vtca.id = taa.treatmentCycleId
INNER JOIN patient_visits_association pva 
    ON pva.id = vtca.visitId
INNER JOIN patient_master pm 
    ON pm.id = pva.patientId
WHERE 
    odm.productType = 'PHARMACY' AND 
    odm.type = 'Treatment' AND 
    odm.paymentStatus = 'PAID' AND 
    odm.orderId = :orderId;
`;

const getConsultationFormFPatientDetails = `
select JSON_ARRAYAGG(
	JSON_OBJECT(
		'scanId', calba.billTypeValue ,
		'scanName', (select sm.name from scan_master sm where sm.id = calba.billTypeValue),
        'isFormFRequired', (select smba.isFormFRequired from scan_master_branch_association smba where smba.scanId = calba.billTypeValue and smba.branchId  = caa.branchId LIMIT 1),
		'doctorName', (select cdm.name from consultation_doctor_master cdm where cdm.userId = caa.consultationDoctorId),
		'patientName', CONCAT(pm.lastName, ' ' , COALESCE(pm.firstName,'')),
		'patientAge', YEAR(CURRENT_DATE()) - YEAR(CAST(pm.dateOfBirth AS DATE)),
		'hospitalAddress', bm.centerNames,
		'resgistrationNumber', bm.registrationNumber ,
		'completeAddress', CONCAT(COALESCE(pm.addressLine1, ''), ' ', COALESCE(pm.addressLine2 , ''), ',',(select cm.name from city_master cm where cm.id = pm.cityId), ',',(select sm.name from state_master sm where sm.id = pm.stateId)),
		'guardianName', (select pga.name from patient_guardian_associations pga where pga.patientId = pva.patientId)
	) 
) as detailsForFormF from consultation_appointment_line_bills_associations calba 
INNER JOIN consultation_appointments_associations caa ON caa.id = calba.appointmentId
INNER JOIN visit_consultations_associations vca on vca.id = caa.consultationId 
INNER JOIN patient_visits_association pva on pva.id = vca.visitId 
INNER JOIN patient_master pm on pm.id = pva.patientId 
INNER JOIN branch_master bm on bm.id = caa.branchId 
WHERE calba.id IN (:refIds)
`;

const getTreatmentFormFPatientDetails = `
select JSON_ARRAYAGG(
	JSON_OBJECT(
		'scanId', talba.billTypeValue ,
		'scanName', (select sm.name from scan_master sm where sm.id = talba.billTypeValue),
        'isFormFRequired', (select smba.isFormFRequired from scan_master_branch_association smba where smba.scanId = talba.billTypeValue and smba.branchId = taa.branchId LIMIT 1),
		'doctorName', (select cdm.name from consultation_doctor_master cdm where cdm.userId = taa.consultationDoctorId),
		'patientName', CONCAT(pm.lastName, ' ' , COALESCE(pm.firstName,'')),
		'patientAge', YEAR(CURRENT_DATE()) - YEAR(CAST(pm.dateOfBirth AS DATE)),
		'hospitalAddress', bm.centerNames,
		'resgistrationNumber', bm.registrationNumber ,
		'completeAddress', CONCAT(COALESCE(pm.addressLine1, ''), ' ', COALESCE(pm.addressLine2 , ''), ',',(select cm.name from city_master cm where cm.id = pm.cityId), ',',(select sm.name from state_master sm where sm.id = pm.stateId)),
		'guardianName', (select pga.name from patient_guardian_associations pga where pga.patientId = pva.patientId)
	) 
) as detailsForFormF from treatment_appointment_line_bills_associations talba  
INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId
INNER JOIN visit_treatment_cycles_associations vtca on vtca.id = taa.treatmentCycleId 
INNER JOIN patient_visits_association pva on pva.id = vtca.visitId 
INNER JOIN patient_master pm on pm.id = pva.patientId 
INNER JOIN branch_master bm on bm.id = taa.branchId 
WHERE talba.id IN (:refIds)

`;

const checkSpouseOrPatientByAppointmentIdQuery = `
SELECT
	arm.isSpouse
FROM
	consultation_appointments_associations caa
INNER JOIN appointment_reason_master arm on
	caa.appointmentReasonId = arm.id
WHERE
	:type = 'Consultation'
	and caa.id = :appointmentId
UNION ALL
SELECT
	arm.isSpouse
FROM
	treatment_appointments_associations taa
INNER JOIN appointment_reason_master arm on
	taa.appointmentReasonId = arm.id
WHERE
	:type = 'Treatment'
	and taa.id = :appointmentId
`;

const patientHeaderForInvoiceQuery = `
SELECT
	JSON_OBJECT(
	'name', (
        	CASE 
        		WHEN :isSpouse = 0 THEN CONCAT(IFNULL(pm.lastName, ''), ' ', IFNULL(pm.firstName, ''))
        		ELSE COALESCE(pga.name, '')
        	END
        ),
        'patientId', pm.patientId ,
        'dob', pm.dateOfBirth ,
        'mobileNumber', pm.mobileNo,
	    'aadhaarNumber', pm.aadhaarNo,
        'ageGender', (
        	CASE
        		WHEN :isSpouse = 0 THEN CONCAT(YEAR(NOW()) - YEAR(pm.dateOfBirth), ' / ' , COALESCE(pm.gender, ''))
        		ELSE CONCAT(pga.age, ' / ', COALESCE(pga.gender, ''))
        	END
        ),
        'doctorName', (SELECT name FROM consultation_doctor_master cdm WHERE cdm.userId = caa.consultationDoctorId)
) as patientInformation
FROM
	consultation_appointments_associations caa 
    INNER JOIN appointment_reason_master arm on arm.id = caa.appointmentReasonId
    INNER JOIN visit_consultations_associations vca on vca.id = caa.consultationId 
    INNER JOIN patient_visits_association pva on pva.id = vca.visitId 
    INNER JOIN patient_master pm on pm.id = pva.patientId 
    LEFT JOIN patient_guardian_associations pga on pga.patientId  = pm.id
WHERE
	caa.id = :appointmentId
	and :type = 'Consultation'
UNION ALL
SELECT
	JSON_OBJECT(
	'name', (
        	CASE 
        		WHEN :isSpouse = 0 THEN CONCAT(IFNULL(pm.lastName, ''), ' ', IFNULL(pm.firstName, ''))
        		ELSE COALESCE(pga.name, '')
        	END
        ),
        'patientId', pm.patientId ,
        'dob', pm.dateOfBirth ,
        'mobileNumber', pm.mobileNo,
	    'aadhaarNumber', pm.aadhaarNo,
        'ageGender', (
        	CASE
        		WHEN :isSpouse = 0 THEN CONCAT(YEAR(NOW()) - YEAR(pm.dateOfBirth), ' / ' , COALESCE(pm.gender, ''))
        		ELSE CONCAT(pga.age, ' / ', COALESCE(pga.gender, ''))
        	END
        ),
        'doctorName', (SELECT name FROM consultation_doctor_master cdm WHERE cdm.userId = taa.consultationDoctorId)
) as patientInformation
FROM
	treatment_appointments_associations taa
    INNER JOIN appointment_reason_master arm on arm.id = taa.appointmentReasonId
    INNER JOIN visit_treatment_cycles_associations vtca on vtca.id = taa.treatmentCycleId  
    INNER JOIN patient_visits_association pva on pva.id = vtca.visitId 
    INNER JOIN patient_master pm on pm.id = pva.patientId 
    LEFT  JOIN patient_guardian_associations pga on pga.patientId  = pm.id
WHERE
	taa.id = :appointmentId
	and :type = 'Treatment'
`;

const patientHeaderForInvoiceQueryTreatmentOrders = `
SELECT
	JSON_OBJECT(
	'name', (
        	CASE 
        		WHEN :isSpouse = 0 THEN CONCAT(IFNULL(pm.lastName, ''), ' ', IFNULL(pm.firstName, ''))
        		ELSE COALESCE(pga.name, '')
        	END
        ),
        'patientId', pm.patientId ,
        'dob', pm.dateOfBirth ,
        'mobileNumber', pm.mobileNo,
	    'aadhaarNumber', pm.aadhaarNo,
        'ageGender', (
        	CASE
        		WHEN :isSpouse = 0 THEN CONCAT(YEAR(NOW()) - YEAR(pm.dateOfBirth), ' / ' , COALESCE(pm.gender, ''))
        		ELSE CONCAT(pga.age, ' / ', COALESCE(pga.gender, ''))
        	END
        ),
        'doctorName', (
	        CASE 
	        	 WHEN tom.productType LIKE 'APPOINTMENT_%' THEN (
					SELECT
						(SELECT cdm.name FROM consultation_doctor_master cdm where cdm.userId = taa.consultationDoctorId)
					FROM treatment_appointments_associations taa 
					WHERE taa.id = SUBSTRING(tom.productType, 13) 
			     )
			     ELSE 'Dr. Jhansi'
	        END
        )
        ) as patientInformation
FROM
	treatment_orders_master tom
INNER JOIN patient_visits_association pva on
	pva.id = tom.visitId
INNER JOIN patient_master pm on
	pm.id = pva.patientId
LEFT JOIN patient_guardian_associations pga on
	pga.patientId = pm.id
WHERE
	tom.id = :id
`;

const patientItemReturnConsultationQueryOtherThanPharmacy = `
SELECT 
    JSON_OBJECT(
        'patientName', CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')),
        'patientId', pm.patientId,
        'doctorName', (
            SELECT cdm.name 
            FROM consultation_doctor_master cdm 
            WHERE cdm.userId = caa.consultationDoctorId
        ),
        'gender', pm.gender,
        'dob', pm.dateOfBirth,
        'appointmentReason', (
            SELECT arm.name 
            FROM appointment_reason_master arm 
            WHERE arm.id = caa.appointmentReasonId
        ),
        'appointmentDate', caa.appointmentDate,
        'purchaseType', 'Consultation'
    ) AS patientDetails,
    (
    	CASE
    		WHEN odm.productType = 'SCAN' THEN (
    			SELECT 
    				JSON_ARRAYAGG(
    					JSON_OBJECT(
    						'refId', refTable.refId,
    						'itemName', refTable.itemName,
    						'itemId', calba.billTypeValue,
    						'totalCost', refTable.totalCost,
    						'isReturned', CASE WHEN calba.returnQuantity = 0 THEN FALSE ELSE TRUE END,
    						'productType', 'SCAN'
    					)
    				)
    			FROM JSON_TABLE(
    			     odm.orderDetails, '$[*]' 
    					COLUMNS (
	    					refId INT PATH '$.refId', 
	    					itemName VARCHAR(100) PATH '$.itemName',
	    					totalCost DECIMAL(10,2) PATH '$.totalCost'
    					) 
    			) AS refTable
    			INNER JOIN consultation_appointment_line_bills_associations calba 
    				ON calba.id = refTable.refId
    		)
    		WHEN odm.productType = 'LAB TEST' THEN (
    			SELECT 
    				JSON_ARRAYAGG(
    					JSON_OBJECT(
    						'refId', refTable.refId,
    						'itemName', refTable.itemName,
    						'itemId', calba.billTypeValue,
    						'totalCost', refTable.totalCost,
    						'isReturned', CASE WHEN calba.returnQuantity = 0 THEN FALSE ELSE TRUE END,
    						'productType', 'LAB TEST'
    					)
    				)
    			FROM JSON_TABLE(
    			     odm.orderDetails, '$[*]' 
    					COLUMNS (
	    					refId INT PATH '$.refId', 
	    					itemName VARCHAR(100) PATH '$.itemName',
	    					totalCost DECIMAL(10,2) PATH '$.totalCost'
    					) 
    			) AS refTable
    			INNER JOIN consultation_appointment_line_bills_associations calba 
    				ON calba.id = refTable.refId
    		)
    		WHEN odm.productType = 'EMBRYOLOGY' THEN (
    			SELECT 
    				JSON_ARRAYAGG(
    					JSON_OBJECT(
    						'refId', refTable.refId,
    						'itemName', refTable.itemName,
    						'itemId', calba.billTypeValue,
    						'totalCost', refTable.totalCost,
    						'isReturned', CASE WHEN calba.returnQuantity = 0 THEN FALSE ELSE TRUE END,
    						'productType', 'EMBRYOLOGY'
    					)
    				)
    			FROM JSON_TABLE(
    			     odm.orderDetails, '$[*]' 
    					COLUMNS (
	    					refId INT PATH '$.refId', 
	    					itemName VARCHAR(100) PATH '$.itemName',
	    					totalCost DECIMAL(10,2) PATH '$.totalCost'
    					) 
    			) AS refTable
    			INNER JOIN consultation_appointment_line_bills_associations calba 
    				ON calba.id = refTable.refId
    		)
    	END
    ) purchasedItems
FROM order_details_master odm
INNER JOIN consultation_appointments_associations caa 
    ON caa.id = odm.appointmentId
INNER JOIN visit_consultations_associations vca 
    ON vca.id = caa.consultationId
INNER JOIN patient_visits_association pva 
    ON pva.id = vca.visitId
INNER JOIN patient_master pm 
    ON pm.id = pva.patientId
WHERE 
    odm.productType NOT IN ('PHARMACY') AND 
    odm.type = 'Consultation' AND 
    odm.paymentStatus = 'PAID' AND 
    odm.orderId = :orderId;
`;

const patientItemReturnTreatementQueryOtherThanPharmacy = `
SELECT 
    JSON_OBJECT(
        'patientName', CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')),
        'patientId', pm.patientId,
        'doctorName', (
            SELECT cdm.name 
            FROM consultation_doctor_master cdm 
            WHERE cdm.userId = taa.consultationDoctorId
        ),
        'gender', pm.gender,
        'dob', pm.dateOfBirth,
        'appointmentReason', (
            SELECT arm.name 
            FROM appointment_reason_master arm 
            WHERE arm.id = taa.appointmentReasonId
        ),
        'appointmentDate', taa.appointmentDate,
        'purchaseType', 'Treatment'
    ) AS patientDetails,
    (
    	CASE
    		WHEN odm.productType = 'SCAN' THEN (
    			SELECT 
    				JSON_ARRAYAGG(
    					JSON_OBJECT(
    						'refId', refTable.refId,
    						'itemName', refTable.itemName,
    						'itemId', talba.billTypeValue,
    						'totalCost', refTable.totalCost,
    						'isReturned', CASE WHEN talba.returnQuantity = 0 THEN FALSE ELSE TRUE END,
    						'productType', 'SCAN'
    					)
    				)
    			FROM JSON_TABLE(
    			     odm.orderDetails, '$[*]' 
    					COLUMNS (
	    					refId INT PATH '$.refId', 
	    					itemName VARCHAR(100) PATH '$.itemName',
	    					totalCost DECIMAL(10,2) PATH '$.totalCost'
    					) 
    			) AS refTable
    			INNER JOIN treatment_appointment_line_bills_associations talba 
    				ON talba.id = refTable.refId
    		)
    		WHEN odm.productType = 'LAB TEST' THEN (
    			SELECT 
    				JSON_ARRAYAGG(
    					JSON_OBJECT(
    						'refId', refTable.refId,
    						'itemName', refTable.itemName,
    						'itemId', talba.billTypeValue,
    						'totalCost', refTable.totalCost,
    						'isReturned', CASE WHEN talba.returnQuantity = 0 THEN FALSE ELSE TRUE END,
    						'productType', 'LAB TEST'
    					)
    				)
    			FROM JSON_TABLE(
    			     odm.orderDetails, '$[*]' 
    					COLUMNS (
	    					refId INT PATH '$.refId', 
	    					itemName VARCHAR(100) PATH '$.itemName',
	    					totalCost DECIMAL(10,2) PATH '$.totalCost'
    					) 
    			) AS refTable
    			INNER JOIN treatment_appointment_line_bills_associations talba 
    				ON talba.id = refTable.refId
    		)
    		WHEN odm.productType = 'EMBRYOLOGY' THEN (
    			SELECT 
    				JSON_ARRAYAGG(
    					JSON_OBJECT(
    						'refId', refTable.refId,
    						'itemName', refTable.itemName,
    						'itemId', talba.billTypeValue,
    						'totalCost', refTable.totalCost,
    						'isReturned', CASE WHEN talba.returnQuantity = 0 THEN FALSE ELSE TRUE END,
    						'productType', 'EMBRYOLOGY'
    					)
    				)
    			FROM JSON_TABLE(
    			     odm.orderDetails, '$[*]' 
    					COLUMNS (
	    					refId INT PATH '$.refId', 
	    					itemName VARCHAR(100) PATH '$.itemName',
	    					totalCost DECIMAL(10,2) PATH '$.totalCost'
    					) 
    			) AS refTable
    			INNER JOIN treatment_appointment_line_bills_associations talba 
    				ON talba.id = refTable.refId
    		)
    	END
    ) purchasedItems
FROM order_details_master odm
INNER JOIN treatment_appointments_associations taa 
    ON taa.id = odm.appointmentId
INNER JOIN visit_treatment_cycles_associations vtca 
    ON vtca.id = taa.treatmentCycleId
INNER JOIN patient_visits_association pva 
    ON pva.id = vtca.visitId
INNER JOIN patient_master pm 
    ON pm.id = pva.patientId
WHERE 
    odm.productType NOT IN ('PHARMACY') AND 
    odm.type = 'Treatment' AND 
    odm.paymentStatus = 'PAID' AND 
    odm.orderId = :orderId;
`;

const patientItemReturnHistoryOtherThanPharmacy = `
SELECT 
    JSON_OBJECT(
        'returnedDate', '%M %d %Y %h:%i:%s %p',
        'orderId', ppr.orderId,
        'patientId', ppr.patientId,
        'patientName', CONCAT(pm.lastName, COALESCE(pm.firstName, ' ')),
        'totalAmount', ppr.totalAmount,
        'returnInformation',
        CASE 
            WHEN ppr.type = 'Treatment' THEN (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'refId', refTable.refId,
                        'itemName', refTable.itemName,
                        'itemId', talba.billTypeValue,
                        'productType', refTable.itemType
                    )
                )
                FROM JSON_TABLE(
                    ppr.returnDetails, '$[*]' 
                    COLUMNS (
                        refId INT PATH '$.refId', 
                        itemId INT PATH '$.itemId',
                        itemType VARCHAR(100) PATH '$.itemType',
                        itemName VARCHAR(100) PATH '$.itemName'
                    )
                ) AS refTable
                INNER JOIN treatment_appointment_line_bills_associations talba 
                    ON talba.id = refTable.refId
            )
            WHEN ppr.type = 'Consultation' THEN (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'refId', refTable.refId,
                        'itemId', refTable.itemId,
                        'itemType', refTable.itemType,
                        'itemName', refTable.itemName
                    )
                )
                FROM JSON_TABLE(
                    ppr.returnDetails, '$[*]' 
                    COLUMNS (
                        refId INT PATH '$.refId',
                        itemId INT PATH '$.itemId',
                        itemType VARCHAR(100) PATH '$.itemType',
                        itemName VARCHAR(100) PATH '$.itemName'
                    )
                ) AS refTable
                INNER JOIN consultation_appointment_line_bills_associations calba 
                    ON calba.id = refTable.refId
            )
        END
    ) AS return_history
FROM patient_purchase_returns ppr
INNER JOIN patient_master pm 
    ON pm.patientId = ppr.patientId
WHERE ppr.orderId = :orderId;

`;

module.exports = {
  invoiceForConsultationAppointmentsQuery,
  invoiceForTreatementAppointmentsQuery,
  pharmacyConsultationProductTable,
  pharmacyTreatmentProductTable,
  patientItemReturnConsultationQuery,
  patientItemReturnTreatementQuery,
  consultationOrderDetailsForInvoiceQuery,
  treatmentOrderDetailsForInvoiceQuery,
  getConsultationFormFPatientDetails,
  getTreatmentFormFPatientDetails,
  invoiceForTreatmentOrdersMileStoneQuery,
  getAppointmentReasonForInvoiceQuery,
  checkSpouseOrPatientByAppointmentIdQuery,
  patientHeaderForInvoiceQuery,
  patientHeaderForInvoiceQueryTreatmentOrders,
  patientItemReturnConsultationQueryOtherThanPharmacy,
  patientItemReturnTreatementQueryOtherThanPharmacy,
  patientItemReturnHistoryOtherThanPharmacy
};
