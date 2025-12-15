const Joi = require("@hapi/joi");
const { id } = require("@hapi/joi/lib/base");

const createConsultantRoasterSchema = Joi.object({
  branchId: Joi.number()
    .integer()
    .required(),
  consultantTypeId: Joi.number()
    .integer()
    .required(),
  priority: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH")
    .default("LOW"),
  consultantName: Joi.string()
    .max(255)
    .required(),
  contactNumber: Joi.string()
    .max(50)
    .optional()
    .allow(null, ""),
  workAddress: Joi.string()
    .optional()
    .allow(null, "")
});

const editConsultantRoasterSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  branchId: Joi.number()
    .integer()
    .required(),
  consultantTypeId: Joi.number()
    .integer()
    .required(),
  priority: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH")
    .default("LOW"),
  consultantName: Joi.string()
    .max(255)
    .required(),
  contactNumber: Joi.string()
    .max(50)
    .optional()
    .allow(null, ""),
  workAddress: Joi.string()
    .optional()
    .allow(null, "")
});

module.exports = {
  createConsultantRoasterSchema,
  editConsultantRoasterSchema
};
