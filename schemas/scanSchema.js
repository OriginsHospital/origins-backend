const Joi = require("@hapi/joi");

const saveScanResultSchema = Joi.object({
  appointmentId: Joi.number().required(),
  scanId: Joi.number().required(),
  type: Joi.string().required(),
  scanTestStatus: Joi.number()
    .valid(1, 2)
    .required(),
  scanResult: Joi.string()
    .optional()
    .allow(null, "")
});

const uploadFormFForScanSchema = Joi.object({
  appointmentId: Joi.number().required(),
  scanId: Joi.number().required(),
  type: Joi.string().required()
});

const deleteFormFForScanSchema = Joi.object({
  appointmentId: Joi.number().required(),
  scanId: Joi.number().required(),
  type: Joi.string().required()
});

const formFTemplatesByScanAppointmentSchema = Joi.object({
  appointmentId: Joi.number().required(),
  scanId: Joi.number().required(),
  type: Joi.string().required()
});

module.exports = {
  saveScanResultSchema,
  uploadFormFForScanSchema,
  deleteFormFForScanSchema,
  formFTemplatesByScanAppointmentSchema
};
