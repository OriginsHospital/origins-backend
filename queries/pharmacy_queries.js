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
    select
	CONCAT(IFNULL(pm.lastName, ''), ' ', IFNULL(pm.firstName, '')) as patientName,
	pga.name as spouseName,
	COALESCE(pm.firstName,'') as firstName,
	pm.patientId, 
	pm.photoPath,
	(select cdm.Name from consultation_doctor_master cdm where cdm.userId = caa.consultationDoctorId) as doctorName,
	calba.appointmentId as appointmentId,
	'Consultation' as type,
	JSON_ARRAYAGG(
		JSON_OBJECT(
			'id', calba.id,
			'itemName', (select sm.itemName from stockmanagement.item_master sm where sm.id = calba.billTypeValue),
			'prescribedQuantity', calba.prescribedQuantity,
			'availableQuantity', (
				select IFNULL(SUM(
						CASE 
							WHEN CAST(NOW() AS DATE) < expiryDate THEN gia.totalQuantity
							ELSE 0
						END
					), 0) as availableQuantity from stockmanagement.grn_items_associations gia 
						INNER JOIN stockmanagement.grn_master gm on gm.id = gia.grnId
					where itemId  = calba.billTypeValue and gm.branchId = caa.branchId
			),
			'purchaseQuantity', calba.purchaseQuantity ,
			'prescriptionDetails', calba.prescriptionDetails ,
			'prescriptionDays', calba.prescriptionDays ,
			'isSpouse', calba.isSpouse,
			'itemStage', (CASE 
				WHEN IFNULL(calba.purchaseQuantity, 0) <> 0 
				AND (select calba_inner.status from consultation_appointment_line_bills_associations calba_inner
					WHERE calba_inner.id = calba.id
				) = 'DUE'THEN 'PACKED'
				WHEN 
				(select calba_inner.status from consultation_appointment_line_bills_associations calba_inner
					WHERE calba_inner.id = calba.id
				) = 'PAID' THEN 'PAID'
				ELSE 'PRESCRIBED'
			END),
			'itemPurchaseInformation', (CASE 
				WHEN IFNULL(calba.purchaseQuantity, 0) <> 0 
				AND (select calba_inner.status from consultation_appointment_line_bills_associations calba_inner
					WHERE calba_inner.id = calba.id
				) = 'DUE'THEN (
					SELECT ppdt.purchaseDetails FROM stockmanagement.pharmacy_purchase_details_temp ppdt where ppdt.refId  = calba.id
				)
				WHEN 
				(select calba_inner.status from consultation_appointment_line_bills_associations calba_inner
					WHERE calba_inner.id = calba.id
				) = 'PAID' THEN NULL
				ELSE NULL
			END)
		) 
	) as itemDetails 
from
	consultation_appointment_line_bills_associations calba
INNER JOIN consultation_appointments_associations caa on
	caa.id = calba.appointmentId
INNER JOIN visit_consultations_associations vca on
	vca.id = caa.consultationId
INNER JOIN patient_visits_association pva on
	pva.id = vca.visitId
INNER JOIN patient_master pm on 
	pva.patientId  = pm.id
LEFT JOIN patient_guardian_associations pga 
		ON pga.patientId = pm.id
WHERE
	calba.billTypeId = 3
	and caa.appointmentDate = :date
	and caa.branchId  = :branchId
GROUP by calba.appointmentId
UNION ALL
select
	CONCAT(IFNULL(pm.lastName, ''), ' ', IFNULL(pm.firstName, '')) as patientName,
	pga.name as spouseName,
	COALESCE(pm.firstName,'') as firstName,
	pm.patientId, 
	pm.photoPath,
	(select cdm.Name from consultation_doctor_master cdm where cdm.userId = taa.consultationDoctorId) as doctorName,
	talba.appointmentId as appointmentId,
	'Treatment' as type,
	JSON_ARRAYAGG(
		JSON_OBJECT(
			'id', talba.id,
			'itemName', (select sm.itemName from stockmanagement.item_master sm where sm.id = talba.billTypeValue),
			'prescribedQuantity', talba.prescribedQuantity,
			'availableQuantity', (
				select IFNULL(SUM(
						CASE 
							WHEN CAST(NOW() AS DATE) < expiryDate THEN gia.totalQuantity
							ELSE 0
						END
					), 0) as availableQuantity from stockmanagement.grn_items_associations gia 
					INNER JOIN stockmanagement.grn_master gm on gm.id = gia.grnId
					where itemId  = talba.billTypeValue and gm.branchId = taa.branchId
			),
			'purchaseQuantity', talba.purchaseQuantity ,
			'prescriptionDetails', talba.prescriptionDetails ,
			'prescriptionDays', talba.prescriptionDays ,
			'isSpouse', talba.isSpouse,
			'itemStage', (CASE 
				WHEN IFNULL(talba.purchaseQuantity, 0) <> 0 
				AND (select talba_inner.status from treatment_appointment_line_bills_associations talba_inner
					WHERE talba_inner.id = talba.id
				) = 'DUE'THEN 'PACKED'
				WHEN 
				(select talba_inner.status from treatment_appointment_line_bills_associations talba_inner
					WHERE talba_inner.id = talba.id
				) = 'PAID' THEN 'PAID'
				ELSE 'PRESCRIBED'
			END),
			'itemPurchaseInformation', (CASE 
				WHEN IFNULL(talba.purchaseQuantity, 0) <> 0 
				AND (select talba_inner.status from treatment_appointment_line_bills_associations talba_inner
					WHERE talba_inner.id = talba.id
				) = 'DUE'THEN (
					SELECT ppdt.purchaseDetails FROM stockmanagement.pharmacy_purchase_details_temp ppdt where ppdt.refId  = talba.id
				)
				WHEN 
				(select talba_inner.status from treatment_appointment_line_bills_associations talba_inner
					WHERE talba_inner.id = talba.id
				) = 'PAID' THEN NULL
				ELSE NULL
			END)
		) 
	) as itemDetails 
from
	treatment_appointment_line_bills_associations talba
INNER JOIN treatment_appointments_associations taa  on
	taa.id = talba.appointmentId
INNER JOIN visit_treatment_cycles_associations vtca on
	vtca.id = taa.treatmentCycleId 
INNER JOIN patient_visits_association pva on
	pva.id = vtca.visitId
INNER JOIN patient_master pm on 
	pva.patientId  = pm.id
LEFT JOIN patient_guardian_associations pga 
		ON pga.patientId = pm.id
WHERE
	talba.billTypeId = 3
	and taa.appointmentDate = :date
	and taa.branchId  = :branchId
GROUP by talba.appointmentId
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

module.exports = {
  getTaxCategoryQuery,
  getInventoryTypeQuery,
  getSupplierQuery,
  getManufacturerQuery,
  getPharmacyListByDateQuery,
  getGrnListQuery,
  pharmacyPurchaseAndStockReductionQuery,
  reduceQuantityQuery,
  geneatePaymentBreakUpDetailsQuery,
  grnItemsReturnHistoryQuery,
  getGrnItemsQuery,
  checkGrnPaymentStatus,
  updateGrnMasterPaymentStatus,
  itemInfoByLineBillId
};
