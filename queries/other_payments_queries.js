const otherPaymentInfoByPatientId = `
SELECT 
	popa.id as refId,
	popa.patientId,
	CONCAT(pm.lastName , ' ', COALESCE(pm.firstName)) as patientName,
	popa.appointmentReason as paymentReason, 
	popa.amount as totalAmount,
	COALESCE((
		SELECT
			SUM(opom.paidOrderAmountBeforeDiscount)
		FROM
			other_payment_orders_master opom
		where
			opom.refId = popa.id and opom.paymentStatus = 'PAID'
	), 0) as paidAmount,
	(
		SELECT JSON_ARRAYAGG(
			JSON_OBJECT(
				'paymentMode', opom.paymentMode, 
				'discountAmount', opom.discountAmount,
				'paidOrderAmount', opom.paidOrderAmountBeforeDiscount,
				'paymentDate', opom.orderDate,
				'couponCode', (SELECT COALESCE(cm.couponCode, '') FROM coupon_master cm where cm.id = opom.couponCode )
			)		
		) FROM 
			other_payment_orders_master opom
		where
			opom.refId = popa.id and opom.paymentStatus = 'PAID'
	) as paymentHistory
FROM patient_other_payment_associations popa 
INNER JOIN patient_master pm on pm.id = popa.patientId
WHERE popa.patientId = :patientId
`;

const otherPaymentInvoiceDetails = `
SELECT
	JSON_OBJECT(
        'orderNo', opom.orderId ,
        'transactionNo', IFNULL(opom.transactionId,'') ,
        'paymentStatus', opom.paymentStatus ,
        'paymentMode', opom.paymentMode,
        'isOnlineMode', CASE WHEN opom.paymentMode IN ('ONLINE', 'UPI') THEN TRUE ELSE FALSE END,
        'isCashMode', CASE WHEN opom.paymentMode = 'CASH' THEN TRUE ELSE FALSE END,
        'orderDate', CAST(opom.orderDate as DATE)
    ) as orderDetails,
    JSON_OBJECT(
        'totalAmount', opom.paidOrderAmountBeforeDiscount ,
        'paidAmount', opom.paidOrderAmount,
        'discount', opom.discountAmount,
        'gst', 0
    ) as paymentBreakUp
FROM
	other_payment_orders_master opom
INNER JOIN patient_other_payment_associations popa on
	popa.id = opom.refId
WHERE opom.refId = :refId
`;

const patientHeaderForInvoiceQuery = `
SELECT
	JSON_OBJECT(
		'name', CONCAT(IFNULL(pm.firstName, ''), ' ', IFNULL(pm.lastName, '')),
        'patientId', pm.patientId ,
        'dob', pm.dateOfBirth ,
        'mobileNumber', pm.mobileNo,
	    'aadhaarNumber', pm.aadhaarNo,
        'ageGender', CONCAT(YEAR(NOW()) - YEAR(pm.dateOfBirth), ' / ' , COALESCE(pm.gender, '')),
        'doctorName', ''
) as patientInformation
FROM
     patient_master pm 
WHERE
	pm.id = :patientId
`;

const purchaseInformationForProductTable = `
SELECT popa.appointmentReason as itemName, opom.paidOrderAmountBeforeDiscount as totalCost FROM other_payment_orders_master opom 
	INNER JOIN patient_other_payment_associations popa on popa.id  = opom.refId
where opom.orderId  = :orderNo
`;

module.exports = {
  otherPaymentInfoByPatientId,
  otherPaymentInvoiceDetails,
  patientHeaderForInvoiceQuery,
  purchaseInformationForProductTable
};
