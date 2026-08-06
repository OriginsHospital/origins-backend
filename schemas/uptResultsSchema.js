const Joi = require("joi");

const saveUptResultSchema = Joi.object({
  resultDate: Joi.string()
    .max(20)
    .required(),
  branchId: Joi.number()
    .integer()
    .required(),
  patientId: Joi.alternatives()
    .try(Joi.number().integer(), Joi.string().max(50))
    .required(),
  patientName: Joi.string()
    .optional()
    .allow("", null),
  cycleType: Joi.string()
    .max(150)
    .required(),
  uptResult: Joi.string()
    .valid("Positive", "Negative")
    .required(),
  createdByNurseId: Joi.number()
    .integer()
    .required()
});

const editUptResultSchema = saveUptResultSchema.keys({
  id: Joi.number()
    .integer()
    .required()
});

module.exports = {
  saveUptResultSchema,
  editUptResultSchema
};
