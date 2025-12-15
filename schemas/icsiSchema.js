const Joi = require("@hapi/joi");

const uploadIcsiSchema = Joi.object({
  visitId: Joi.number().required(),
  patientId: Joi.number().required()
});

const triggerSchema = Joi.object({
  visitId: Joi.number().required(),
  patientId: Joi.number().required()
});

const uploadEraSchema = Joi.object({
  visitId: Joi.number().required(),
  patientId: Joi.number().required()
});

module.exports = {
  uploadIcsiSchema,
  triggerSchema,
  uploadEraSchema
};
