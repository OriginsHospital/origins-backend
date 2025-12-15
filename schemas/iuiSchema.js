const Joi = require("@hapi/joi");

const uploadIuiSchema = Joi.object({
  visitId: Joi.number().required(),
  patientId: Joi.number().required()
});

module.exports = {
  uploadIuiSchema
};
