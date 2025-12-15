const Joi = require("@hapi/joi");

const getUsersListSchema = Joi.object({
  isVerified: Joi.number()
    .integer()
    .required()
});

const branchChangeRequestSchema = Joi.object({
  branchData: Joi.array()
    .min(1)
    .required()
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().required()
});

module.exports = {
  getUsersListSchema,
  branchChangeRequestSchema,
  changePasswordSchema
};
