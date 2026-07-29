const Joi = require("@hapi/joi");

const emailRule = Joi.string()
  .email({ tlds: { allow: false } })
  .required();

const portalLoginSchema = Joi.object({
  email: emailRule,
  password: Joi.string()
    .min(6)
    .required()
});

const createStaffSchema = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(100)
    .required(),
  email: emailRule,
  userName: Joi.string()
    .min(3)
    .max(100)
    .required(),
  password: Joi.string()
    .min(6)
    .max(100)
    .required(),
  roleId: Joi.number()
    .integer()
    .required(),
  aadhaarNo: Joi.string()
    .length(12)
    .allow(null, ""),
  branches: Joi.array()
    .items(Joi.number().integer())
    .min(1)
    .required(),
  modules: Joi.array()
    .items(
      Joi.object({
        moduleId: Joi.number()
          .integer()
          .required(),
        accessType: Joi.string()
          .valid("R", "W", "r", "w")
          .required()
      })
    )
    .optional()
    .default([])
});

const createPatientLoginSchema = Joi.object({
  patientMasterId: Joi.number()
    .integer()
    .required(),
  email: emailRule,
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
});

const searchPatientsSchema = Joi.object({
  q: Joi.string()
    .allow("")
    .optional()
    .default("")
});

module.exports = {
  portalLoginSchema,
  createStaffSchema,
  createPatientLoginSchema,
  searchPatientsSchema
};
