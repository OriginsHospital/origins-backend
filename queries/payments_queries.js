const getAllPaymentsQuery = `
SELECT 
  p.id,
  p.branchId,
  bm.branchCode AS branch,
  p.paymentDate,
  p.invoiceDate,
  p.departmentId,
  dm.name AS department,
  p.vendorId,
  vm.name AS vendor,
  p.amount,
  p.invoiceUrl,
  p.receiptUrl,
  p.createdBy,
  u.fullName AS createdByName,
  p.createdAt,
  p.updatedAt
FROM 
  payments p
LEFT JOIN 
  branch_master bm ON bm.id = p.branchId
LEFT JOIN 
  department_master dm ON dm.id = p.departmentId
LEFT JOIN 
  stockmanagement.vendor_master vm ON vm.id = p.vendorId
LEFT JOIN 
  users u ON u.id = p.createdBy
ORDER BY p.createdAt DESC;
`;

module.exports = {
  getAllPaymentsQuery
};
