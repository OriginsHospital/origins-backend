const Joi = require("@hapi/joi");

const blockedSlotSchema = Joi.object({
  blockedDate: Joi.string()
    .max(100)
    .required(),
  blockedList: Joi.array().required()
});

const getBlockedTimeSlotsSchema = Joi.object({
  blockedDate: Joi.string()
    .max(100)
    .required()
});

module.exports = {
  blockedSlotSchema,
  getBlockedTimeSlotsSchema
};
