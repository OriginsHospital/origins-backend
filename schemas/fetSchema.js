const Joi = require("@hapi/joi");

const uploadFetSchema = Joi.object({
  visitId: Joi.number().required(),
  patientId: Joi.number().required()
});


module.exports = {
  uploadFetSchema
};
