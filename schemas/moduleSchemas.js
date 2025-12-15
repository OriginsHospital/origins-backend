const Joi = require("@hapi/joi");

const createModuleSchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required()
});

const editModuleSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  name: Joi.string()
    .max(100)
    .required()
});

module.exports = {
  createModuleSchema,
  editModuleSchema
};
