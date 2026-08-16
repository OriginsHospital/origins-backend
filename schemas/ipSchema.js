const Joi = require("@hapi/joi");

const addNewIndentSchema = Joi.object({
  patientId: Joi.number().required(),
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.number().required(),
        prescribedQuantity: Joi.number().required()
      })
    )
    .min(1)
    .required()
});

const createIPRegistrationSchema = Joi.object({
  branchId: Joi.number().required(),
  patientId: Joi.number().required(),
  procedureId: Joi.number().required(),
  dateOfAdmission: Joi.date().required(),
  timeOfAdmission: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/) // HH:mm or HH:mm:ss
    .required(),
  buildingId: Joi.number().required(),
  floorId: Joi.number().required(),
  roomId: Joi.number().required(),
  bedId: Joi.number().required(),
  packageAmount: Joi.number()
    .precision(2)
    .allow(null)
    .optional(),
  dateOfDischarge: Joi.date()
    .allow(null)
    .optional()
});

const createIPNotesSchema = Joi.object({
  ipId: Joi.number().required(),
  notes: Joi.string().required()
});

const closeIpRegistrationSchema = Joi.object({
  id: Joi.number().required(),
  dateOfDischarge: Joi.date().required()
});

const ipRoomChangeSchema = Joi.object({
  ipId: Joi.number().required(),
  buildingId: Joi.number().required(),
  floorId: Joi.number().required(),
  roomId: Joi.number().required(),
  bedId: Joi.number().required()
});

const collectIPPaymentSchema = Joi.object({
  ipId: Joi.number().required(),
  paymentMode: Joi.string()
    .valid("CASH", "UPI", "CARD", "SPLIT")
    .required(),
  roomAmount: Joi.number()
    .min(0)
    .default(0),
  medicineAmount: Joi.number()
    .min(0)
    .default(0),
  packageAmount: Joi.number()
    .min(0)
    .default(0),
  otherAmount: Joi.number()
    .min(0)
    .default(0),
  otherDescription: Joi.string()
    .allow("", null)
    .optional(),
  remarks: Joi.string()
    .allow("", null)
    .optional()
});

module.exports = {
  addNewIndentSchema,
  createIPRegistrationSchema,
  createIPNotesSchema,
  closeIpRegistrationSchema,
  ipRoomChangeSchema,
  collectIPPaymentSchema
};
