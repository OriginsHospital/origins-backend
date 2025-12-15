const Joi = require("@hapi/joi");

const createAppointmentReasonSchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required(),
  visit_type: Joi.number().required(),
  appointmentCharges: Joi.number()
    .required(),
  isActive: Joi.number().required(),
  isSpouse: Joi.number().integer().required(),
  visitTypeName: Joi.string().optional()
});

const editAppointmentReasonSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  name: Joi.string()
    .max(100)
    .required(),
  visit_type: Joi.number().required(),
  appointmentCharges: Joi.number()
    .required(),
  isActive: Joi.number().required(),
  isSpouse: Joi.number().integer().required(),
  visitTypeName: Joi.string().optional()
});


module.exports = {
  createAppointmentReasonSchema,
  editAppointmentReasonSchema
};
