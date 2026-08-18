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

const saveUptResultSchema = Joi.object({
  resultDate: Joi.alternatives()
    .try(Joi.date(), Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/))
    .required(),
  branchId: Joi.number()
    .integer()
    .required(),
  patientId: Joi.number()
    .integer()
    .required(),
  cycleType: Joi.string()
    .valid("IVF", "OI-TI", "IUI")
    .required(),
  uptResult: Joi.string()
    .valid("Positive", "Negative")
    .required(),
  createdByNurseId: Joi.number()
    .integer()
    .required()
});

const saveDischargeCardSchema = Joi.object({
  visitId: Joi.number()
    .integer()
    .required(),
  patientId: Joi.number()
    .integer()
    .required(),
  appointmentId: Joi.number()
    .integer()
    .optional()
    .allow(null),
  appointmentType: Joi.string()
    .optional()
    .allow(null, ""),
  treatmentCycleId: Joi.number()
    .integer()
    .optional()
    .allow(null),
  cardData: Joi.object().required()
});

const editUptResultSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  resultDate: Joi.alternatives()
    .try(Joi.date(), Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/))
    .required(),
  branchId: Joi.number()
    .integer()
    .required(),
  patientId: Joi.number()
    .integer()
    .required(),
  cycleType: Joi.string()
    .valid("IVF", "OI-TI", "IUI")
    .required(),
  uptResult: Joi.string()
    .valid("Positive", "Negative")
    .required(),
  createdByNurseId: Joi.number()
    .integer()
    .required()
});

module.exports = {
  saveScanResultSchema,
  uploadFormFForScanSchema,
  deleteFormFForScanSchema,
  formFTemplatesByScanAppointmentSchema,
  saveUptResultSchema,
  editUptResultSchema,
  saveDischargeCardSchema
};
