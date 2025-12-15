const Joi = require("@hapi/joi");
const saveEmbryologyTreatmentSchema = Joi.object({
  treatmentCycleId: Joi.number().required(),
  categoryType: Joi.string().required(),
  template: Joi.string().required(),
  embryologyType: Joi.number().required()
});

const editEmbryologyTreatmentSchema = Joi.object({
  categoryType: Joi.string().required(),
  template: Joi.string().required(),
  embryologyType: Joi.number().required()
});

const saveEmbryologyConsultationSchema = Joi.object({
  consultationId: Joi.number().required(),
  categoryType: Joi.string().required(),
  template: Joi.string().required(),
  embryologyType: Joi.number().required()
});

const editEmbryologyConsultationSchema = Joi.object({
  categoryType: Joi.string().required(),
  template: Joi.string().required(),
  embryologyType: Joi.number().required()
});

const uploadEmbryologyImageSchema = Joi.object({
  embryologyId: Joi.number().required(),
  type: Joi.string()
    .valid("treatment", "consultation")
    .required()
});

const deleteEmbryologyImageSchema = Joi.object({
  embryologyImageId: Joi.number().required(),
  type: Joi.string()
    .valid("treatment", "consultation")
    .required()
});

module.exports = {
  saveEmbryologyTreatmentSchema,
  editEmbryologyTreatmentSchema,
  saveEmbryologyConsultationSchema,
  editEmbryologyConsultationSchema,
  uploadEmbryologyImageSchema,
  deleteEmbryologyImageSchema
};
