const Joi = require("@hapi/joi");

const createDoctorAvailabilitySchema = Joi.object({
  doctorId: Joi.number().required(),
  doctorName: Joi.string().required(),
  shiftFrom: Joi.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/) // Regular expression for 24-hour format "__:__"
    .required(),
  shiftTo: Joi.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/) // Regular expression for 24-hour format "__:__"
    .required()
});

const saveLabTestsPharmacyNotesSchema = Joi.object({
  createType: Joi.string()
    .valid("Consultation", "Treatment")
    .required(),
  appointmentId: Joi.number().required(),
  lineBillEntries: Joi.array()
    .items(
      Joi.object({
        billTypeId: Joi.number().required(),
        billTypeValues: Joi.array()
          .items(
            Joi.object({
              id: Joi.number().required(),
              name: Joi.string().required(),
              amount: Joi.number().required(),
              prescribedQuantity: Joi.number().optional(),
              prescriptionDetails: Joi.string().allow(""),
              prescriptionDays: Joi.number()
                .optional()
                .allow(null),
              isSpouse: Joi.number()
                .valid(0, 1)
                .optional()
                .default(0)
            })
          )
          .required()
      })
    )
    .min(0)
    .required(),
  notes: Joi.string()
    .allow("")
    .optional(),
  isSpouse: Joi.number()
    .valid(0, 1)
    .optional()
    .default(0)
});

const deleteDoctorAvailabilitySchema = Joi.object({
  id: Joi.number().required()
});

const shiftChangeRequestSchema = Joi.object({
  shiftFrom: Joi.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/) // Regular expression for 24-hour format "__:__"
    .required(),
  shiftTo: Joi.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/) // Regular expression for 24-hour format "__:__"
    .required()
});

const setIsCompletedTrueSchema = Joi.object({
  type: Joi.string()
    .valid("Consultation", "Treatment")
    .required(),
  appointmentId: Joi.number().required()
});

module.exports = {
  createDoctorAvailabilitySchema,
  deleteDoctorAvailabilitySchema,
  saveLabTestsPharmacyNotesSchema,
  shiftChangeRequestSchema,
  setIsCompletedTrueSchema
};
