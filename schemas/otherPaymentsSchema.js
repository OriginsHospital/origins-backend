const Joi = require("@hapi/joi");

const addNewPaymentSchema = Joi.object({
  patientId: Joi.number().required(),
  appointmentReason: Joi.string().required(),
  amount: Joi.string().required()
});

const getOrderIdSchema = Joi.object({
  refId: Joi.number().required(),
  totalOrderAmount: Joi.number().required(),
  payableAmount: Joi.number().required(),
  couponCode: Joi.number()
    .integer()
    .optional()
    .allow(null),
  discountAmount: Joi.number().required(),
  payableAfterDiscountAmount: Joi.number().required(),
  pendingOrderAmount: Joi.number().required(),
  paymentMode: Joi.string().required(),
  isSplitPayment: Joi.boolean().optional(),
  splitPayment: Joi.object({
    cashAmount: Joi.number().required(),
    upiAmount: Joi.number().required(),
    totalAmount: Joi.number().required()
  }).optional(),
  splitPaymentSummary: Joi.string()
    .optional()
    .allow("", null)
});

const sendTransactionIdSchema = Joi.object({
  orderId: Joi.string().required(),
  transactionId: Joi.string().required(),
  transactionType: Joi.string().optional("")
});

module.exports = {
  addNewPaymentSchema,
  getOrderIdSchema,
  sendTransactionIdSchema
};
