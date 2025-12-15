const Joi = require("@hapi/joi");

const createCouponSchema = Joi.object({
  couponCode: Joi.string()
    .max(100)
    .required(),
  discountPercentage: Joi.number().required(),
  isActive: Joi.number()
    .integer()
    .required()
});

const editCouponSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  couponCode: Joi.string()
    .max(100)
    .required(),
  discountPercentage: Joi.number()
    .optional()
    .allow(null),
  isActive: Joi.number()
    .integer()
    .required()
});

module.exports = {
  createCouponSchema,
  editCouponSchema
};
