const Joi = require("@hapi/joi");

const editRoleSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  name: Joi.string()
    .max(100)
    .required(),
  moduleList: Joi.array().required()
});

const addRoleSchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required(),
  moduleList: Joi.array().required()
});

module.exports = {
  editRoleSchema,
  addRoleSchema
};
