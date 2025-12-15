const Joi = require("@hapi/joi");

const createOrdersSchema = Joi.object({
  branchId: Joi.number()
    .integer()
    .required(),
  orderDate: Joi.date().required(),
  departmentId: Joi.number()
    .integer()
    .required(),
  vendorId: Joi.number()
    .integer()
    .required(),
  supplyItems: Joi.array()
    .items(
      Joi.object({
        supplyItemId: Joi.number()
          .integer()
          .required(),
        quantity: Joi.number()
          .integer()
          .min(1)
          .required()
      })
    )
    .min(1)
    .required()
});

const placeOrderSchema = Joi.object({
  orderId: Joi.number()
    .integer()
    .required(),
  expectedArrivalDate: Joi.date().required()
});

const receiveOrderSchema = Joi.object({
  orderId: Joi.number()
    .integer()
    .required(),
  receivedDate: Joi.date().required()
});

const paidOrderSchema = Joi.object({
  orderId: Joi.number()
    .integer()
    .required(),
  paymentAmount: Joi.number().required(),
  paymentDate: Joi.date().required()
});

module.exports = {
  createOrdersSchema,
  placeOrderSchema,
  receiveOrderSchema,
  paidOrderSchema
};
