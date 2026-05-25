const getTaxCategoryQuery = `SELECT tcm.id, tcm.categoryName, tcm.taxPercent , u.fullName as createdBy, tcm.createdAt,tcm.updatedAt
FROM stockmanagement.tax_category_master tcm 
INNER JOIN defaultdb.users u ON tcm.createdBy = u.id`;

const getInventoryTypeQuery = `SELECT itm.id, itm.name, u.fullName AS createdBy,itm.createdAt,itm.updatedAt
FROM stockmanagement.inventory_type_master itm
INNER JOIN defaultdb.users u ON itm.createdBy = u.id`;

const getSupplierQuery = `SELECT sm.id, sm.supplier, sm.gstNumber, sm.contactPerson, sm.contactNumber, sm.emailId, sm.tinNumber, sm.panNumber, sm.dlNumber, sm.address, sm.accountDetails, sm.remarks, sm.isActive, u.fullName AS createdBy, sm.createdAt, sm.updatedAt
FROM stockmanagement.supplier_master sm
INNER JOIN defaultdb.users u ON sm.createdBy = u.id`;

const getManufacturerQuery = `SELECT mm.id, mm.manufacturer, mm.address, mm.contactNumber, mm.emailId, mm.isActive, u.fullName AS createdBy, mm.createdAt, mm.updatedAt
FROM stockmanagement.manufacturer_master mm
INNER JOIN defaultdb.users u ON mm.createdBy = u.id`;

const getPharmacyListByDateQuery = `
WITH consultation_line_ids AS (
	SELECT calba.id AS lineId
	FROM consultation_appointment_line_bills_associations calba
	INNER JOIN consultation_appointments_associations caa ON caa.id = calba.appointmentId
	WHERE calba.billTypeId = 3
		AND caa.appointmentDate = :date
		AND caa.branchId = :branchId
),
treatment_line_ids AS (
	SELECT talba.id AS lineId
	FROM treatment_appointment_line_bills_associations talba
	INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId
	WHERE talba.billTypeId = 3
		AND taa.appointmentDate = :date
		AND taa.branchId = :branchId
),
branch_item_stock AS (
	SELECT
		gia.itemId,
		gm.branchId,
		IFNULL(SUM(
			CASE
				WHEN CAST(NOW() AS DATE) < gia.expiryDate THEN gia.totalQuantity
				ELSE 0
			END
		), 0) AS availableQuantity
	FROM stockmanagement.grn_items_associations gia
	INNER JOIN stockmanagement.grn_master gm ON gm.id = gia.grnId
	WHERE gm.branchId = :branchId
	GROUP BY gia.itemId, gm.branchId
),
pharmacy_paid_orders AS (
	SELECT
		jt.refId,
		odm.type,
		MAX(odm.id) AS orderDbId
	FROM defaultdb.order_details_master odm
	INNER JOIN JSON_TABLE(
		odm.orderDetails,
		'$[*]' COLUMNS(refId INT PATH '$.refId')
	) jt ON 1 = 1
	WHERE odm.productType = 'PHARMACY'
		AND odm.paymentStatus = 'PAID'
		AND odm.type IN ('Consultation', 'Treatment')
		AND (
			jt.refId IN (SELECT lineId FROM consultation_line_ids)
			OR jt.refId IN (SELECT lineId FROM treatment_line_ids)
		)
	GROUP BY jt.refId, odm.type
),
pharmacy_order_details AS (
	SELECT
		ppo.refId,
		ppo.type,
		odm.orderId,
		odm.id AS orderDbId
	FROM pharmacy_paid_orders ppo
	INNER JOIN defaultdb.order_details_master odm ON odm.id = ppo.orderDbId
),
purchase_non_reason AS (
	SELECT
		ppdt.refId,
		ppdt.type,
		MAX(NULLIF(TRIM(jt.nonPurchaseReason), '')) AS nonPurchaseReason
	FROM stockmanagement.pharmacy_purchase_details_temp ppdt
	INNER JOIN JSON_TABLE(
		ppdt.purchaseDetails,
		'$[*]' COLUMNS (
			nonPurchaseReason VARCHAR(500) PATH '$.nonPurchaseReason'
		)
	) jt ON 1 = 1
	WHERE (
		(ppdt.type = 'Consultation' AND ppdt.refId IN (SELECT lineId FROM consultation_line_ids))
		OR (ppdt.type = 'Treatment' AND ppdt.refId IN (SELECT lineId FROM treatment_line_ids))
	)
	GROUP BY ppdt.refId, ppdt.type
)
SELECT
	CONCAT(IFNULL(pm.lastName, ''), ' ', IFNULL(pm.firstName, '')) AS patientName,
	pga.name AS spouseName,
	COALESCE(pm.firstName, '') AS firstName,
	pm.patientId,
	pm.photoPath,
	cdm.Name AS doctorName,
	calba.appointmentId AS appointmentId,
	pva.id AS visitId,
	CASE
		WHEN pva.isActive = 1 AND EXISTS (
			SELECT 1
			FROM visit_packages_associations vpa
			WHERE vpa.visitId = pva.id
				AND (
					IFNULL(vpa.marketingPackage, 0) > 0
					OR IFNULL(vpa.doctorSuggestedPackage, 0) > 0
				)
		) THEN 1
		ELSE 0
	END AS hasActivePackage,
	'Consultation' AS type,
	JSON_ARRAYAGG(
		JSON_OBJECT(
			'id', calba.id,
			'orderId', pod.orderId,
			'orderDbId', pod.orderDbId,
			'itemName', sm.itemName,
			'prescribedQuantity', calba.prescribedQuantity,
			'availableQuantity', IFNULL(bis.availableQuantity, 0),
			'purchaseQuantity', calba.purchaseQuantity,
			'nonPurchaseReason', pnr.nonPurchaseReason,
			'prescriptionDetails', calba.prescriptionDetails,
			'prescriptionDays', calba.prescriptionDays,
			'isSpouse', calba.isSpouse,
			'itemStage', (
				CASE
					WHEN IFNULL(calba.purchaseQuantity, 0) <> 0 AND calba.status = 'DUE' THEN 'PACKED'
					WHEN calba.status = 'PAID' THEN 'PAID'
					ELSE 'PRESCRIBED'
				END
			),
			'itemPurchaseInformation', (
				CASE
					WHEN IFNULL(calba.purchaseQuantity, 0) <> 0 AND calba.status = 'DUE' THEN ppdt.purchaseDetails
					ELSE NULL
				END
			)
		)
	) AS itemDetails
FROM consultation_appointment_line_bills_associations calba
INNER JOIN consultation_appointments_associations caa ON caa.id = calba.appointmentId
INNER JOIN visit_consultations_associations vca ON vca.id = caa.consultationId
INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
INNER JOIN patient_master pm ON pva.patientId = pm.id
LEFT JOIN patient_guardian_associations pga ON pga.patientId = pm.id
LEFT JOIN consultation_doctor_master cdm ON cdm.userId = caa.consultationDoctorId
LEFT JOIN stockmanagement.item_master sm ON sm.id = calba.billTypeValue
LEFT JOIN branch_item_stock bis ON bis.itemId = calba.billTypeValue AND bis.branchId = caa.branchId
LEFT JOIN pharmacy_order_details pod ON pod.refId = calba.id AND pod.type = 'Consultation'
LEFT JOIN stockmanagement.pharmacy_purchase_details_temp ppdt
	ON ppdt.refId = calba.id AND ppdt.type = 'Consultation'
LEFT JOIN purchase_non_reason pnr ON pnr.refId = calba.id AND pnr.type = 'Consultation'
WHERE calba.billTypeId = 3
	AND caa.appointmentDate = :date
	AND caa.branchId = :branchId
GROUP BY calba.appointmentId
UNION ALL
SELECT
	CONCAT(IFNULL(pm.lastName, ''), ' ', IFNULL(pm.firstName, '')) AS patientName,
	pga.name AS spouseName,
	COALESCE(pm.firstName, '') AS firstName,
	pm.patientId,
	pm.photoPath,
	cdm.Name AS doctorName,
	talba.appointmentId AS appointmentId,
	pva.id AS visitId,
	CASE
		WHEN pva.isActive = 1 AND EXISTS (
			SELECT 1
			FROM visit_packages_associations vpa
			WHERE vpa.visitId = pva.id
				AND (
					IFNULL(vpa.marketingPackage, 0) > 0
					OR IFNULL(vpa.doctorSuggestedPackage, 0) > 0
				)
		) THEN 1
		ELSE 0
	END AS hasActivePackage,
	'Treatment' AS type,
	JSON_ARRAYAGG(
		JSON_OBJECT(
			'id', talba.id,
			'orderId', pod.orderId,
			'orderDbId', pod.orderDbId,
			'itemName', sm.itemName,
			'prescribedQuantity', talba.prescribedQuantity,
			'availableQuantity', IFNULL(bis.availableQuantity, 0),
			'purchaseQuantity', talba.purchaseQuantity,
			'nonPurchaseReason', pnr.nonPurchaseReason,
			'prescriptionDetails', talba.prescriptionDetails,
			'prescriptionDays', talba.prescriptionDays,
			'isSpouse', talba.isSpouse,
			'itemStage', (
				CASE
					WHEN IFNULL(talba.purchaseQuantity, 0) <> 0 AND talba.status = 'DUE' THEN 'PACKED'
					WHEN talba.status = 'PAID' THEN 'PAID'
					ELSE 'PRESCRIBED'
				END
			),
			'itemPurchaseInformation', (
				CASE
					WHEN IFNULL(talba.purchaseQuantity, 0) <> 0 AND talba.status = 'DUE' THEN ppdt.purchaseDetails
					ELSE NULL
				END
			)
		)
	) AS itemDetails
FROM treatment_appointment_line_bills_associations talba
INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId
INNER JOIN visit_treatment_cycles_associations vtca ON vtca.id = taa.treatmentCycleId
INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
INNER JOIN patient_master pm ON pva.patientId = pm.id
LEFT JOIN patient_guardian_associations pga ON pga.patientId = pm.id
LEFT JOIN consultation_doctor_master cdm ON cdm.userId = taa.consultationDoctorId
LEFT JOIN stockmanagement.item_master sm ON sm.id = talba.billTypeValue
LEFT JOIN branch_item_stock bis ON bis.itemId = talba.billTypeValue AND bis.branchId = taa.branchId
LEFT JOIN pharmacy_order_details pod ON pod.refId = talba.id AND pod.type = 'Treatment'
LEFT JOIN stockmanagement.pharmacy_purchase_details_temp ppdt
	ON ppdt.refId = talba.id AND ppdt.type = 'Treatment'
LEFT JOIN purchase_non_reason pnr ON pnr.refId = talba.id AND pnr.type = 'Treatment'
WHERE talba.billTypeId = 3
	AND taa.appointmentDate = :date
	AND taa.branchId = :branchId
GROUP BY talba.appointmentId
`;

const pharmacyPurchaseAndStockReductionQuery = `
select gia.grnId , SUM(gia.totalQuantity) as totalQuantity ,gia.itemId, gia.expiryDate,  gia.mrpPerTablet, gia.batchNo
from stockmanagement.grn_items_associations gia 
INNER JOIN stockmanagement.grn_master gm on gm.id = gia.grnId
WHERE gia.itemId = (
	CASE 
		WHEN :type  = 'Consultation' THEN (select billTypeValue from consultation_appointment_line_bills_associations calba where calba.id = :id)
		WHEN :type  =  'Treatment' THEN (select billTypeValue from treatment_appointment_line_bills_associations talba where talba.id = :id )
	END
)
AND CAST(NOW() as DATE) < gia.expiryDate and gm.branchId = :branchId
group by gia.grnId , gia.expiryDate, gia.itemId  
order by gia.expiryDate
`;

const getGrnListQuery = `
	select gm.id as grnId, gm.grnNo, gm.branchId, (select bm.branchCode from defaultdb.branch_master bm where bm.id = gm.branchId) as branchName,
	gm.date , gm.supplierId ,sm.supplier  as supplierName,
	gm.supplierEmail , gm.supplierAddress , gm.supplierGstNumber ,
	gm.invoiceNumber, gm.status, gm.createdAt, gm.updatedAt
	from stockmanagement.grn_master gm 
	INNER JOIN stockmanagement.supplier_master sm 
	on gm.supplierId  = sm.id
	where gm.branchId in (:branchId)
	order by gm.date  desc;
`;

const getGrnItemsQuery = `
	select gia.*, im.itemName  from stockmanagement.grn_items_associations gia 
	inner join stockmanagement.item_master im on im.id  = gia.itemId 
	where gia.grnId = :grnId
`;

const reduceQuantityQuery = `
	UPDATE stockmanagement.grn_items_associations SET totalQuantity  = totalQuantity  - :reduceQuantity
	WHERE itemId = (
	CASE 
		WHEN :type  = 'Consultation' THEN (select billTypeValue from defaultdb.consultation_appointment_line_bills_associations calba where calba.id = :id)
		WHEN :type  =  'Treatment' THEN (select billTypeValue from defaultdb.treatment_appointment_line_bills_associations talba where talba.id = :id )
	END
) and grnId = :grnId
`;

const restoreQuantityQuery = `
	UPDATE stockmanagement.grn_items_associations SET totalQuantity  = totalQuantity  + :restoreQuantity
	WHERE itemId = (
	CASE 
		WHEN :type  = 'Consultation' THEN (select billTypeValue from defaultdb.consultation_appointment_line_bills_associations calba where calba.id = :id)
		WHEN :type  =  'Treatment' THEN (select billTypeValue from defaultdb.treatment_appointment_line_bills_associations talba where talba.id = :id )
	END
) and grnId = :grnId
`;
const geneatePaymentBreakUpDetailsQuery = `
	select
	ppdt.*,
	(select im.itemName from stockmanagement.item_master im
	WHERE im.id  = CASE 
		WHEN :type = 'Consultation' THEN (select billTypeValue from defaultdb.consultation_appointment_line_bills_associations calba where calba.id = :id)
		WHEN :type  =  'Treatment' THEN (select billTypeValue from defaultdb.treatment_appointment_line_bills_associations talba where talba.id = :id )
	END ) as itemName
	from
		stockmanagement.pharmacy_purchase_details_temp ppdt
	WHERE ppdt.refId  = :id;
`;

const grnItemsReturnHistoryQuery = `
	select gir.id, gir.grnId ,gm.grnNo, gm.branchId, (select bm.branchCode from defaultdb.branch_master bm where bm.id = gm.branchId) as branchName,
	gir.supplierId , sm.supplier as supplierName,
	gir.returnDetails , CAST(gir.updatedAt AS DATE) as returnedDate, gir.totalAmount  from stockmanagement.grn_item_returns gir 
	INNER JOIN stockmanagement.grn_master gm on gm.id = gir.grnId 
	INNER JOIN stockmanagement.supplier_master sm on sm.id  = gir.supplierId 
	where gm.branchId in (:branchId)
	order by gir.updatedAt desc;
`;
const checkGrnPaymentStatus = `
SELECT status FROM stockmanagement.grn_master WHERE grnNo = :grnNumber
`;

const updateGrnMasterPaymentStatus = `
UPDATE stockmanagement.grn_master
SET  status='PAID'
WHERE grnNo=:grnNumber;
`;

const itemInfoByLineBillId = `
SELECT 
	im.itemName
FROM stockmanagement.item_master im 
WHERE im.id = (
CASE 
	WHEN :type  = 'Consultation' THEN (select billTypeValue from consultation_appointment_line_bills_associations calba where calba.id = :id)
	WHEN :type  =  'Treatment' THEN (select billTypeValue from treatment_appointment_line_bills_associations talba where talba.id = :id )
END
)
`;

const verifyGrnItemLineBranchQuery = `
  SELECT gia.id
  FROM stockmanagement.grn_items_associations gia
  INNER JOIN stockmanagement.grn_master gm ON gm.id = gia.grnId
  WHERE gia.id = :grnItemAssociationId AND gm.branchId = :branchId AND gia.isReturned = 0
`;

const deleteGrnItemLinesForItemBranchQuery = `
  DELETE gia FROM stockmanagement.grn_items_associations gia
  INNER JOIN stockmanagement.grn_master gm ON gm.id = gia.grnId
  WHERE gia.itemId = :itemId AND gm.branchId = :branchId AND gia.isReturned = 0
`;

const getGrnStockLinesForItemBranchQuery = `
  SELECT gia.id, gia.totalQuantity
  FROM stockmanagement.grn_items_associations gia
  INNER JOIN stockmanagement.grn_master gm ON gm.id = gia.grnId
  WHERE gia.itemId = :itemId AND gm.branchId = :branchId AND gia.isReturned = 0
  ORDER BY gia.id
`;

const reassignGrnStockItemIdForBranchQuery = `
  UPDATE stockmanagement.grn_items_associations gia
  INNER JOIN stockmanagement.grn_master gm ON gm.id = gia.grnId
  SET gia.itemId = :newItemId
  WHERE gia.itemId = :oldItemId AND gm.branchId = :branchId AND gia.isReturned = 0
`;

const getGrnTransferPreviewByIdQuery = `
  SELECT
    gm.id AS grnId,
    gm.grnNo,
    gm.branchId AS sourceBranchId,
    gm.invoiceNumber,
    bm.name AS sourceBranchName,
    bm.branchCode AS sourceBranchCode,
    gia.itemId,
    im.itemName,
    SUM(gia.totalQuantity) AS availableQuantity
  FROM stockmanagement.grn_master gm
  INNER JOIN stockmanagement.grn_items_associations gia ON gia.grnId = gm.id
  INNER JOIN stockmanagement.item_master im ON im.id = gia.itemId
  INNER JOIN defaultdb.branch_master bm ON bm.id = gm.branchId
  WHERE gm.id = :grnId AND gia.isReturned = 0
  GROUP BY gm.id, gm.grnNo, gm.branchId, gm.invoiceNumber, bm.name, bm.branchCode, gia.itemId, im.itemName
  ORDER BY im.itemName;
`;

const getGrnItemStockLinesForTransferQuery = `
  SELECT
    gia.id,
    gia.grnId,
    gia.itemId,
    gia.batchNo,
    gia.expiryDate,
    gia.pack,
    gia.quantity,
    gia.freeQuantity,
    gia.mrp,
    gia.rate,
    gia.mrpPerTablet,
    gia.ratePerTablet,
    gia.discountPercentage,
    gia.taxPercentage,
    gia.discountAmount,
    gia.taxAmount,
    gia.amount,
    gia.totalQuantity
  FROM stockmanagement.grn_items_associations gia
  WHERE gia.grnId = :grnId
    AND gia.itemId = :itemId
    AND gia.isReturned = 0
    AND gia.totalQuantity > 0
  ORDER BY gia.expiryDate ASC, gia.id ASC;
`;

const getGrnBranchTransferHistoryQuery = `
  SELECT
    gbtm.id,
    gbtm.sourceGrnId,
    gbtm.transferGrnId,
    gbtm.transferInvoiceNumber,
    gbtm.transferredQuantity,
    gbtm.transferDate,
    gbtm.sourceBranchId,
    src.name AS sourceBranchName,
    src.branchCode AS sourceBranchCode,
    gbtm.destinationBranchId,
    dst.name AS destinationBranchName,
    dst.branchCode AS destinationBranchCode,
    gbtm.itemId,
    im.itemName,
    gbtm.transferredBy,
    u.fullName AS transferredByName
  FROM stockmanagement.grn_branch_transfer_master gbtm
  INNER JOIN defaultdb.branch_master src ON src.id = gbtm.sourceBranchId
  INNER JOIN defaultdb.branch_master dst ON dst.id = gbtm.destinationBranchId
  INNER JOIN stockmanagement.item_master im ON im.id = gbtm.itemId
  LEFT JOIN defaultdb.users u ON u.id = gbtm.transferredBy
  WHERE gbtm.sourceBranchId IN (:branchId) OR gbtm.destinationBranchId IN (:branchId)
  ORDER BY gbtm.transferDate DESC, gbtm.id DESC;
`;

module.exports = {
  getTaxCategoryQuery,
  getInventoryTypeQuery,
  getSupplierQuery,
  getManufacturerQuery,
  getPharmacyListByDateQuery,
  getGrnListQuery,
  pharmacyPurchaseAndStockReductionQuery,
  reduceQuantityQuery,
  restoreQuantityQuery,
  geneatePaymentBreakUpDetailsQuery,
  grnItemsReturnHistoryQuery,
  getGrnItemsQuery,
  checkGrnPaymentStatus,
  updateGrnMasterPaymentStatus,
  itemInfoByLineBillId,
  verifyGrnItemLineBranchQuery,
  deleteGrnItemLinesForItemBranchQuery,
  getGrnStockLinesForItemBranchQuery,
  reassignGrnStockItemIdForBranchQuery,
  getGrnTransferPreviewByIdQuery,
  getGrnItemStockLinesForTransferQuery,
  getGrnBranchTransferHistoryQuery
};
