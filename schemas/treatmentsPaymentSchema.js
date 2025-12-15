const Joi = require("@hapi/joi");
const packageDetailsSchema = Joi.object({
  visitId: Joi.number().optional(),
  marketingPackage: Joi.number().optional(),
  registrationDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  registrationAmount: Joi.number().optional(),
  donorBookingAmount: Joi.number().optional(),
  day1Amount: Joi.number().optional(),
  pickUpAmount: Joi.number().optional(),
  hysteroscopyAmount: Joi.number().optional(),
  day5FreezingAmount: Joi.number().optional(),
  fetAmount: Joi.number().optional(),
  eraAmount: Joi.number().optional(),
  pgtaAmount: Joi.number().optional(),
  uptPositiveAmount: Joi.number().optional(),
  discount: Joi.number()
    .optional()
    .allow(null)
});

const getOrderIdSchema = Joi.object({
  totalOrderAmount: Joi.string().required(),
  payableAmount: Joi.string().required(),
  couponCode: Joi.number()
    .integer()
    .optional()
    .allow(null),
  discountAmount: Joi.string().required(),
  payableAfterDiscountAmount: Joi.string().required(),
  pendingOrderAmount: Joi.string().required(),
  productType: Joi.string().required(),
  dateColumn: Joi.string().optional().allow("").allow(null),
  mileStoneStartedDate: Joi.string().optional().allow("").allow(null),
  appointmentId: Joi.number()
    .integer()
    .optional()
    .allow(null),
  comments: Joi.string().optional().allow(""),
  dueDate: Joi.string().optional().allow(null).allow("")
});

const sendTransactionSchema = Joi.object({
  visitId: Joi.number()
    .integer()
    .required(),
  orderId: Joi.string().required(),
  transactionId: Joi.string().required(),
  isPackageExists: Joi.number().required(),
  packageDetails: packageDetailsSchema.optional().allow(null),
  appointmentId: Joi.number()
    .integer()
    .optional()
    .allow(null),
  dateColumns: Joi.object().optional()
});

const getTreatmentOrderIdSchema = Joi.object({
  visitId: Joi.number()
    .integer()
    .required(),
  paymentMode: Joi.string().required(),
  isPackageExists: Joi.number().required(),
  packageDetails: packageDetailsSchema.optional().allow(null),
  orderDetails: Joi.array().items(getOrderIdSchema)
})

module.exports = {
  getOrderIdSchema,
  sendTransactionSchema,
  packageDetailsSchema,
  getTreatmentOrderIdSchema
};
