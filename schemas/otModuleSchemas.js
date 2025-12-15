const Joi = require("@hapi/joi");

const savePersonListSchema = Joi.object({
  personName: Joi.string()
    .max(100)
    .required(),
  designationId: Joi.number()
    .integer()
    .required(),
  phoneNumber: Joi.string()
    .max(100)
    .required()
});

const editPersonListSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  personName: Joi.string()
    .max(100)
    .required(),
  designationId: Joi.number()
    .integer()
    .required(),
  name: Joi.string()
    .max(100)
    .optional(),
  phoneNumber: Joi.string()
    .max(100)
    .required()
});

const saveOtListSchema = Joi.object({
  patientName: Joi.string()
    .max(100)
    .required(),
  procedureName: Joi.string()
    .max(100)
    .required(),
  procedureDate: Joi.string()
    .max(10)
    .required(),
  time: Joi.string()
    .max(100)
    .required(),
  branchId: Joi.number()
    .integer()
    .required(),
  treatmentCycleId: Joi.number()
    .integer()
    .optional()
    .allow(null),
  surgeonId: Joi.string()
    .max(100)
    .required(),
  anesthetistId: Joi.number()
    .integer()
    .required(),
  embryologistId: Joi.number()
    .integer()
    .required(),
  otStaff: Joi.string()
    .max(100)
    .required()
});

const editOtListSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  patientName: Joi.string()
    .max(100)
    .required(),
  procedureName: Joi.string()
    .max(100)
    .required(),
  procedureDate: Joi.string()
    .max(10)
    .required(),
  time: Joi.string()
    .max(100)
    .required(),
  branchId: Joi.number()
    .integer()
    .required(),
  surgeonId: Joi.string()
    .max(100)
    .required(),
  anesthetistId: Joi.number()
    .integer()
    .required(),
  embryologistId: Joi.number()
    .integer()
    .required(),
  otStaff: Joi.string()
    .max(100)
    .required()
});

const getPersonSuggestionSchema = Joi.object({
  searchText: Joi.string()
    .max(100)
    .required(),
  designationId: Joi.number()
    .integer()
    .required()
});

const saveInjectionDetailsSchema = Joi.object({
  patientId: Joi.number()
    .integer()
    .required(),
  patientName: Joi.string().optional(),
  administeredDate: Joi.string()
    .max(100)
    .required(),
  administeredTime: Joi.string()
    .max(100)
    .required(),
  medicationId: Joi.number().required(),
  medicationName: Joi.string().optional(),
  dosage: Joi.string()
    .max(1000)
    .required(),
  administeredNurseId: Joi.number()
    .integer()
    .required(),
  originsId: Joi.string()
    .optional()
    .allow(null)
});

const editInjectionDetailsSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  patientName: Joi.string().optional(),
  patientId: Joi.number()
    .integer()
    .required(),
  administeredDate: Joi.string()
    .max(100)
    .required(),
  administeredTime: Joi.string()
    .max(100)
    .required(),
  medicationId: Joi.number().required(),
  medicationName: Joi.string().optional(),
  dosage: Joi.string()
    .max(1000)
    .required(),
  administeredNurseId: Joi.number()
    .integer()
    .required(),
  originsId: Joi.string()
    .optional()
    .allow(null),
  firstName: Joi.string()
    .optional()
    .allow(null)
});

module.exports = {
  savePersonListSchema,
  saveOtListSchema,
  editPersonListSchema,
  getPersonSuggestionSchema,
  editOtListSchema,
  saveInjectionDetailsSchema,
  editInjectionDetailsSchema
};
