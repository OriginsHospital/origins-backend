const Joi = require("@hapi/joi");

const createPatientSchema = Joi.object({
  aadhaarNo: Joi.string()
    .length(12)
    .required(),
  branchId: Joi.number().required(),
  mobileNo: Joi.string()
    .regex(/^[6-9]\d{9}$/)
    .required(),
  email: Joi.string()
    .email()
    .optional()
    .allow(null)
    .allow(""),
  firstName: Joi.string()
    .max(50)
    .required(),
  lastName: Joi.string()
    .max(50)
    .optional()
    .allow(null),
  gender: Joi.string()
    .valid("Male", "Female", "Other")
    .optional()
    .allow(null),
  maritalStatus: Joi.string()
    .valid("Single", "Married", "Divorced", "Widowed")
    .required(),
  dateOfBirth: Joi.date()
    .optional()
    .allow(""),
  bloodGroup: Joi.string()
    .optional()
    .allow("")
    .allow(null),
  addressLine1: Joi.string()
    .optional()
    .allow(""),
  addressLine2: Joi.string()
    .allow("")
    .optional(),
  patientTypeId: Joi.number().required(),
  cityId: Joi.number()
    .optional()
    .allow(null),
  stateId: Joi.number()
    .optional()
    .allow(null),
  referralId: Joi.number()
    .optional()
    .allow(null),
  referralName: Joi.string()
    .optional()
    .allow(null),
  pincode: Joi.string()
    .length(6)
    .optional()
    .allow(null),
  photoPath: Joi.string()
    .allow("")
    .optional()
    .allow(null),
  hasGuardianInfo: Joi.boolean().required(),
  guardianDetails: Joi.string().optional(),
  createActiveVisit: Joi.boolean().required()
});

const guardianSchema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number()
    .integer()
    .required(),
  gender: Joi.string()
    .optional()
    .allow(null),
  aadhaarNo: Joi.string()
    .allow("")
    .optional(),
  email: Joi.string()
    .allow("")
    .optional(),
  relation: Joi.string()
    .optional()
    .allow(null),
  bloodGroup: Joi.string()
    .optional()
    .allow("")
    .allow(null),
  additionalDetails: Joi.string()
    .allow("")
    .optional()
});

const createGuardianSchema = Joi.object({
  patientId: Joi.number().required(),
  name: Joi.string().required(),
  age: Joi.number()
    .integer()
    .required(),
  aadhaarNo: Joi.string()
    .allow("")
    .optional(),
  email: Joi.string()
    .allow("")
    .optional(),
  relation: Joi.string()
    .optional()
    .allow(null),
  bloodGroup: Joi.string()
    .optional()
    .allow("")
    .allow(null),
  additionalDetails: Joi.string()
    .allow("")
    .optional()
});

const editPatientSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  branchId: Joi.number()
    .integer()
    .required(),
  aadhaarNo: Joi.string()
    .length(12)
    .required(),
  mobileNo: Joi.string()
    .regex(/^[6-9]\d{9}$/)
    .required(),
  email: Joi.string()
    .email()
    .optional()
    .allow(null)
    .allow(""),
  firstName: Joi.string()
    .max(50)
    .required(),
  lastName: Joi.string()
    .max(50)
    .optional()
    .allow(null),
  gender: Joi.string()
    .valid("Male", "Female", "Other")
    .optional()
    .allow(null),
  maritalStatus: Joi.string().required(),
  dateOfBirth: Joi.date().optional(),
  bloodGroup: Joi.string()
    .optional()
    .allow("")
    .allow(null),
  addressLine1: Joi.string()
    .optional()
    .allow(""),
  addressLine2: Joi.string()
    .allow("")
    .optional(),
  patientTypeId: Joi.number().required(),
  cityId: Joi.number()
    .optional()
    .allow(null),
  stateId: Joi.number()
    .optional()
    .allow(null),
  referralId: Joi.number()
    .optional()
    .allow(null),
  referralName: Joi.string()
    .optional()
    .allow(null),
  pincode: Joi.string()
    .length(6)
    .optional()
    .allow(null),
  photoPath: Joi.string()
    .allow("")
    .optional()
    .allow(null)
});

const editGuardianSchema = Joi.object({
  id: Joi.number().required(),
  patientId: Joi.number().required(),
  name: Joi.string().required(),
  age: Joi.number()
    .integer()
    .required(),
  gender: Joi.string()
    .optional()
    .allow(null),
  aadhaarNo: Joi.string()
    .allow("")
    .allow(null)
    .optional(),
  email: Joi.string()
    .allow("")
    .allow(null)
    .optional(),
  relation: Joi.string()
    .optional()
    .allow(null),
  bloodGroup: Joi.string()
    .optional()
    .allow("")
    .allow(null),
  additionalDetails: Joi.string()
    .allow("")
    .allow(null)
    .optional()
});

const saveOpdSheetSchema = Joi.object({
  patientId: Joi.number().required(),
  template: Joi.string().required()
});

const saveDischargeSummarySheet = Joi.object({
  treatmentCycleId: Joi.number().required(),
  template: Joi.string().required()
});

const savePickUpSheet = Joi.object({
  treatmentCycleId: Joi.number().required(),
  template: Joi.string().required()
});

module.exports = {
  createPatientSchema,
  editPatientSchema,
  guardianSchema,
  createGuardianSchema,
  editGuardianSchema,
  saveOpdSheetSchema,
  saveDischargeSummarySheet,
  savePickUpSheet
};
