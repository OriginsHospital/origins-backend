const getAllExpensesQuery = `
SELECT 
  em.id,
  JSON_OBJECT(
    'id', em.branchId,
    'branchName', bm.branchCode
  ) AS branch,
  JSON_OBJECT(
    'id', em.category,
    'categoryName', ecm.categoryName
  ) AS category,
  JSON_OBJECT(
    'id', em.subCategory,
    'subCategoryName', esm.ledgerName
  ) AS subCategory,
  em.amount,
  em.paymentMode,
  em.description,
  em.paymentDate,
  em.createdAt,
  em.updatedAt,
  (
    SELECT JSON_ARRAYAGG(era.receiptUrl)
    FROM expense_receipts_associations era
    WHERE era.expenseId = em.id
  ) AS invoiceReceipt
FROM 
  expenses_master em
LEFT JOIN 
  branch_master bm ON bm.id = em.branchId
LEFT JOIN 
  expense_categories_master ecm ON ecm.id = em.category
LEFT JOIN 
  expense_subcategories_master esm ON esm.id = em.subCategory
  ORDER BY em.updatedAt DESC;
`;

const getExpenseDetailsByIdQuery = `
SELECT 
  em.id,
  JSON_OBJECT(
    'id', em.branchId,
    'branchName', bm.branchCode
  ) AS branch,
  JSON_OBJECT(
    'id', em.category,
    'categoryName', ecm.categoryName
  ) AS category,
  JSON_OBJECT(
    'id', em.subCategory,
    'subCategoryName', esm.ledgerName
  ) AS subCategory,
  em.amount,
  em.paymentMode,
  em.description,
  em.paymentDate,
  em.createdAt,
  em.updatedAt,
  (
    SELECT JSON_ARRAYAGG(era.receiptUrl)
    FROM expense_receipts_associations era
    WHERE era.expenseId = em.id
  ) AS receipts
FROM 
  expenses_master em
LEFT JOIN 
  branch_master bm ON bm.id = em.branchId
LEFT JOIN 
  expense_categories_master ecm ON ecm.id = em.category
LEFT JOIN 
  expense_subcategories_master esm ON esm.id = em.subCategory
WHERE em.id = :expenseId
`;

const getAllSubCategoriesByCategoryIdQuery = `
    select
      esm.id,
      esm.ledgerName,
      esm.categoryId ,
      ecm.categoryName
    from
      expense_subcategories_master esm
    INNER JOIN
    expense_categories_master ecm on
      esm.categoryId = ecm.id
    where
      ecm.id = :categoryId  
`;

module.exports = {
  getAllExpensesQuery,
  getExpenseDetailsByIdQuery,
  getAllSubCategoriesByCategoryIdQuery
};
