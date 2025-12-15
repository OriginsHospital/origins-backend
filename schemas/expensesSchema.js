const Joi = require("@hapi/joi");

const saveExpensesSchema = Joi.object({
  branchId: Joi.number()
    .integer()
    .required(),
  category: Joi.number()
    .integer()
    .required(),
  subCategory: Joi.number()
    .integer()
    .required(),
  description: Joi.string()
    .max(255)
    .allow("", null), // Allow empty strings for description
  paymentMode: Joi.string()
    .valid("CASH", "ONLINE", "UPI")
    .required(),
  amount: Joi.number()
    .precision(2)
    .required(),
  paymentDate: Joi.date().required()
});

const editExpensesSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  branchId: Joi.number()
    .integer()
    .required(),
  category: Joi.number()
    .integer()
    .required(),
  subCategory: Joi.number()
    .integer()
    .required(),
  paymentMode: Joi.string()
    .valid("CASH", "ONLINE", "UPI")
    .required(),
  amount: Joi.number()
    .precision(2)
    .required(),
  description: Joi.string()
    .max(255)
    .required(),
  paymentDate: Joi.date().required()
});

const deleteReceiptSchema = Joi.object({
  expenseId: Joi.number()
    .integer()
    .required(),
  receiptUrl: Joi.string().required()
});

const saveSubCategorySchema = Joi.object({
  categoryId: Joi.number()
    .integer()
    .required(),
  ledgerName: Joi.string()
    .max(255)
    .required()
});

const editSubCategorySchema = Joi.object({
  categoryId: Joi.number()
    .integer()
    .required(),
  ledgerName: Joi.string()
    .max(255)
    .required(),
  id: Joi.number()
    .integer()
    .required()
});

const deleteSubCategorySchema = Joi.object({
  categoryId: Joi.number()
    .integer()
    .required(),
  id: Joi.number()
    .integer()
    .required()
});

module.exports = {
  saveExpensesSchema,
  editExpensesSchema,
  deleteReceiptSchema,
  saveSubCategorySchema,
  editSubCategorySchema,
  deleteSubCategorySchema
};
