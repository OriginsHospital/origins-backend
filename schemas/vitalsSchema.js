const Joi = require("@hapi/joi");

const createVitalsSchema = Joi.object({
  patientId: Joi.string().required(),
  doctorId: Joi.number()
    .integer()
    .required(),
  appointmentId: Joi.number()
    .integer()
    .required(),
  type: Joi.string().required(),
  appointmentDate: Joi.string().required(),
  weight: Joi.string().required(),
  height: Joi.string().required(),
  bmi: Joi.string().required(),
  bp: Joi.string().required(),
  initials: Joi.string().required(),
  notes: Joi.string().optional(),
  spouseHeight: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  spouseWeight: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  spouseBmi: Joi.string()
    .optional()
    .allow(null)
    .allow("")
});

const editVitalsSchema = Joi.object({
  id: Joi.number().required(),
  patientId: Joi.string().required(),
  doctorId: Joi.number()
    .integer()
    .required(),
  appointmentId: Joi.number()
    .integer()
    .required(),
  type: Joi.string().required(),
  appointmentDate: Joi.string().required(),
  weight: Joi.string().required(),
  height: Joi.string().required(),
  bmi: Joi.string().required(),
  bp: Joi.string().required(),
  initials: Joi.string().required(),
  notes: Joi.string().optional(),
  spouseHeight: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  spouseWeight: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  spouseBmi: Joi.string()
    .optional()
    .allow(null)
    .allow("")
});

module.exports = {
  createVitalsSchema,
  editVitalsSchema
};
