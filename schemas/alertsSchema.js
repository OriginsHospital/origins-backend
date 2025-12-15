const Joi = require("@hapi/joi");

const createAlertsSchema = Joi.object({
  alertMessage: Joi.string().required()
});

const editAlertsSchema = Joi.object({
  alertId: Joi.number()
    .integer()
    .required(),
  alertMessage: Joi.string().required()
});

const deleteAlertsSchema = Joi.object({
  alertId: Joi.number()
    .integer()
    .required()
});

module.exports = {
  createAlertsSchema,
  editAlertsSchema,
  deleteAlertsSchema
};
