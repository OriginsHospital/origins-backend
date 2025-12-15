const getAllOrdersList = `
SELECT 
    om.id AS orderId,
    bm.branchCode AS branch,
    om.orderDate,
    JSON_OBJECT('id', dm.id, 'departmentName', dm.name) AS department,
    JSON_OBJECT('id', vm.id, 'vendorName', vm.name) AS vendor,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'id', sm.id,
            'supplyItemName', sm.name,
            'quantity', osi.quantity
        )
    ) AS supplyItems,
    om.orderStatus,
    om.expectedArrivalDate,
    om.receivedDate,
    om.invoiceUrl,
    om.paymentAmount,
    om.paymentDate,
    om.isActive,
    JSON_OBJECT('id', u.id, 'fullName', u.fullName) AS createdBy,
    CAST(om.createdAt AS DATE) AS createdAt
FROM orders_master om 
INNER JOIN branch_master bm ON bm.id = om.branchId
INNER JOIN department_master dm ON dm.id = om.departmentId
INNER JOIN stockmanagement.vendor_master vm ON vm.id = om.vendorId
INNER JOIN order_supply_items osi ON osi.orderId = om.id
INNER JOIN stockmanagement.supplies_master sm ON sm.id = osi.supplyItemId
INNER JOIN users u ON u.id = om.createdBy
GROUP BY om.id
ORDER BY 
    FIELD(om.orderStatus, 'Ordered', 'Placed', 'Received', 'Completed'),
    om.orderDate DESC , 
    om.updatedAt DESC;
`;

module.exports = {
  getAllOrdersList
};
