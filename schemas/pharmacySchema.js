const Joi = require("@hapi/joi");

const createTaxCategorySchema = Joi.object({
  categoryName: Joi.string().required(),
  taxPercent: Joi.number().required()
});

const editTaxCategorySchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  categoryName: Joi.string().required(),
  taxPercent: Joi.number().required()
});

const createInventoryTypeSchema = Joi.object({
  name: Joi.string().required()
});

const editInventoryTypeSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  name: Joi.string().required()
});

const createSupplierSchema = Joi.object({
  supplier: Joi.string().required(),
  gstNumber: Joi.string().required(),
  contactPerson: Joi.string().required(),
  contactNumber: Joi.string().required(),
  emailId: Joi.string()
    .email()
    .optional()
    .allow(null, ""),
  tinNumber: Joi.string()
    .optional()
    .allow(null, ""),
  panNumber: Joi.string()
    .optional()
    .allow(null, ""),
  dlNumber: Joi.string()
    .optional()
    .allow(null, ""),
  address: Joi.string()
    .optional()
    .allow(null, ""),
  accountDetails: Joi.string()
    .optional()
    .allow(null, ""),
  remarks: Joi.string()
    .optional()
    .allow(null, ""),
  isActive: Joi.number().required()
});

const editSupplierSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  supplier: Joi.string().required(),
  gstNumber: Joi.string().required(),
  contactPerson: Joi.string().required(),
  contactNumber: Joi.string().required(),
  emailId: Joi.string()
    .email()
    .optional()
    .allow(null, ""),
  tinNumber: Joi.string()
    .optional()
    .allow(null, ""),
  panNumber: Joi.string()
    .optional()
    .allow(null, ""),
  dlNumber: Joi.string()
    .optional()
    .allow(null, ""),
  address: Joi.string()
    .optional()
    .allow(null, ""),
  accountDetails: Joi.string()
    .optional()
    .allow(null, ""),
  remarks: Joi.string()
    .optional()
    .allow(null, ""),
  isActive: Joi.number().required()
});

const createManufacturerSchema = Joi.object({
  manufacturer: Joi.string().required(),
  address: Joi.string()
    .optional()
    .allow(null, ""),
  contactNumber: Joi.string()
    .optional()
    .allow(null, ""),
  emailId: Joi.string()
    .email()
    .optional()
    .allow(null, ""),
  isActive: Joi.number().required()
});

const editManufacturerSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  manufacturer: Joi.string().required(),
  address: Joi.string()
    .optional()
    .allow(null, ""),
  contactNumber: Joi.string()
    .optional()
    .allow(null, ""),
  emailId: Joi.string()
    .email()
    .optional()
    .allow(null, ""),
  isActive: Joi.number().required()
});

const itemPurchaseInformation = Joi.object({
  expiryDate: Joi.string().required(),
  mrpPerTablet: Joi.string().required(),
  grnId: Joi.number().required(),
  returnedQuantity: Joi.number().required(),
  usedQuantity: Joi.number().required(),
  initialUsedQuantity: Joi.number().optional(),
  batchNo: Joi.string().optional()
});

const updatePharmacyDetailsSchema = Joi.array().items(
  Joi.object({
    id: Joi.number()
      .integer()
      .required(),
    type: Joi.string()
      .valid("Consultation", "Treatment")
      .required(),
    purchaseQuantity: Joi.number()
      .integer()
      .required(),
    itemPurchaseInformation: Joi.array().items(itemPurchaseInformation)
  })
);

const generatePaymentBreakUpSchema = Joi.array().items(
  Joi.object({
    id: Joi.number()
      .integer()
      .required(),
    type: Joi.string()
      .valid("Consultation", "Treatment")
      .required(),
    purchaseQuantity: Joi.number()
      .integer()
      .required(),
    itemPurchaseInformation: Joi.array().items(itemPurchaseInformation)
  })
);

const grnDetailsSchema = Joi.object({
  date: Joi.date(),
  branchId: Joi.number()
    .integer()
    .required(),
  supplierId: Joi.number()
    .integer()
    .optional(),
  supplierName: Joi.string().optional(),
  supplierEmail: Joi.string().optional(),
  supplierAddress: Joi.string().optional(),
  supplierGstNumber: Joi.string().optional(),
  invoiceNumber: Joi.string().optional()
});

const grnPaymentDetailsSchema = Joi.object({
  grnId: Joi.number()
    .integer()
    .optional(),
  subTotal: Joi.number().optional(),
  overAllDiscountPercentage: Joi.number().optional(),
  overAllDiscountAmount: Joi.number().optional(),
  netAmount: Joi.number().optional(),
  otherCharges: Joi.number().optional(),
  freight: Joi.number().optional(),
  cst: Joi.number().optional(),
  excise: Joi.number().optional(),
  cess: Joi.number().optional(),
  creditNoteAmount: Joi.number().optional(),
  netPayable: Joi.number().optional(),
  remarks: Joi.string().optional()
});

const grnItemDetailsSchema = Joi.object({
  grnId: Joi.number()
    .integer()
    .optional(),
  itemId: Joi.number().optional(),
  itemName: Joi.string().optional(),
  batchNo: Joi.string().optional(),
  expiryDate: Joi.date().required(),
  pack: Joi.number().optional(),
  quantity: Joi.number()
    .precision(2)
    .optional(),
  freeQuantity: Joi.number()
    .precision(2)
    .optional(),
  mrp: Joi.number().optional(),
  rate: Joi.number().optional(),
  mrpPerTablet: Joi.number().optional(),
  ratePerTablet: Joi.number().optional(),
  discountPercentage: Joi.number().optional(),
  taxPercentage: Joi.number().optional(),
  discountAmount: Joi.number().optional(),
  taxAmount: Joi.number().optional(),
  amount: Joi.number().optional()
});

const saveGrnDetailsSchema = Joi.object({
  grnDetails: grnDetailsSchema,
  grnPaymentDetails: grnPaymentDetailsSchema,
  grnItemDetails: Joi.array().items(grnItemDetailsSchema)
});

const returnGrnItemsSchema = Joi.object({
  grnId: Joi.number()
    .integer()
    .required(),
  returnDetails: Joi.array(),
  supplierId: Joi.number()
    .integer()
    .required(),
  totalAmount: Joi.number().required()
});

const saveGrnPaymentsSchema = Joi.object({
  grnNo: Joi.string().required(),
  amount: Joi.number()
    .precision(2)
    .required(),
  typeOfPayment: Joi.string()
    .valid("CASH", "NEFT")
    .required(),
  paymentDate: Joi.date(),
  remarks: Joi.string().optional()
});

module.exports = {
  createTaxCategorySchema,
  editTaxCategorySchema,
  createInventoryTypeSchema,
  editInventoryTypeSchema,
  createSupplierSchema,
  editSupplierSchema,
  createManufacturerSchema,
  editManufacturerSchema,
  updatePharmacyDetailsSchema,
  saveGrnDetailsSchema,
  generatePaymentBreakUpSchema,
  returnGrnItemsSchema,
  saveGrnPaymentsSchema
};
