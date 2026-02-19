const Joi = require("@hapi/joi");

const orderDetailsSchema = Joi.object({
  totalOrderAmount: Joi.number().required(),
  paidOrderAmount: Joi.number().required(),
  discountAmount: Joi.number().required(),
  couponCode: Joi.number()
    .integer()
    .optional()
    .allow(null),
  paymentMode: Joi.string()
    .valid("CASH", "ONLINE", "UPI")
    .required(),
  productType: Joi.string()
    .max(100)
    .required(),
  orderDetails: Joi.array()
    .items()
    .min(1)
    .required()
});

const transactionDetailsSchema = Joi.object({
  orderId: Joi.string().required(),
  transactionId: Joi.string().required(),
  transactionType: Joi.string().optional("")
});

const invoiceSchema = Joi.object({
  id: Joi.number()
    .optional()
    .allow(null),
  appointmentId: Joi.number()
    .optional()
    .allow(null),
  type: Joi.string().required(),
  productType: Joi.string().required()
});

const returnPharmacyItemSchema = Joi.object({
  patientId: Joi.string().required(),
  orderId: Joi.string().required(),
  totalAmount: Joi.number().required(),
  type: Joi.string()
    .valid("Consultation", "Treatment")
    .required(),
  returnDetails: Joi.array()
    .items(
      Joi.object({
        refId: Joi.number()
          .integer()
          .required(),
        itemId: Joi.number()
          .integer()
          .required(),
        returnInfo: Joi.array()
          .items(
            Joi.object({
              grnId: Joi.number()
                .integer()
                .required(),
              returnQuantity: Joi.number()
                .integer()
                .min(1)
                .required()
            })
          )
          .min(1)
          .required()
      })
    )
    .min(1)
    .required(),
  refundMethod: Joi.string()
    .optional()
    .allow("", null)
});

const returnSchema = Joi.object({
  patientId: Joi.string().required(),
  orderId: Joi.string().required(),
  totalAmount: Joi.number().required(),
  type: Joi.string().required(),
  returnDetails: Joi.array().items(
    Joi.object({
      itemId: Joi.number()
        .integer()
        .required(),
      refId: Joi.number()
        .integer()
        .required(),
      itemName: Joi.string().required(),
      itemType: Joi.string().required(),
      itemCost: Joi.number().required()
    })
      .min(1)
      .required()
  )
});

module.exports = {
  orderDetailsSchema,
  transactionDetailsSchema,
  invoiceSchema,
  returnPharmacyItemSchema,
  returnSchema
};
