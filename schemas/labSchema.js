const Joi = require("@hapi/joi");

const saveLabTestResultSchema = Joi.object({
  appointmentId: Joi.number().required(),
  labTestId: Joi.number().required(),
  type: Joi.string().required(),
  labTestStatus: Joi.number()
    .valid(1, 2)
    .required(),
  labTestResult: Joi.string()
    .optional()
    .allow(null, ""),
  isSpouse: Joi.number()
    .valid(0, 1)
    .required()
});

const saveOutsourcingLabTestResultSchema = Joi.object({
  appointmentId: Joi.number().required(),
  labTestId: Joi.number().required(),
  type: Joi.string().required(),
  labTestStatus: Joi.number()
    .valid(1, 2)
    .required(),
  isSpouse: Joi.number()
    .valid(0, 1)
    .required()
});

module.exports = {
  saveLabTestResultSchema,
  saveOutsourcingLabTestResultSchema
};
