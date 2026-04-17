const Joi = require("@hapi/joi");

const consultationGetAvailableDoctorsSchema = Joi.object({
  date: Joi.string()
    .max(100)
    .required()
});

const consultationGetAvailableSlotsSchema = Joi.object({
  date: Joi.string()
    .max(100)
    .required(),
  doctorId: Joi.number()
    .integer()
    .required()
});

const consultationBookAppointmentSchema = Joi.object({
  date: Joi.string()
    .max(100)
    .required(),
  doctorId: Joi.number()
    .integer()
    .required(),
  consultationId: Joi.number()
    .integer()
    .required()
    .allow(null),
  timeStart: Joi.string()
    .max(10)
    .required(),
  timeEnd: Joi.string()
    .max(10)
    .required(),
  appointmentReasonId: Joi.number()
    .integer()
    .required(),
  branchId: Joi.number()
    .integer()
    .required()
});

const changeStatusSchema = Joi.object({
  appointmentId: Joi.number()
    .integer()
    .required(),
  stage: Joi.string()
    .valid("Booked", "Arrived", "Scan", "Doctor", "Seen", "Done")
    .max(100)
    .required(),
  type: Joi.string()
    .valid("Treatment", "Consultation")
    .max(100)
    .required(),
  patientId: Joi.string().required(),
  appointmentDate: Joi.string().required(),
  visitId: Joi.number().required(),
  isPackageExists: Joi.number().optional()
});

const getAppointmentsByIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  type: Joi.string()
    .valid("Treatment", "Consultation")
    .max(100)
    .required()
});

const linebillItemSchema = Joi.object({
  billType: Joi.number().required(),
  TotalAmount: Joi.number().required()
});

const lineBillSchema = Joi.object({
  appointmentId: Joi.number().required(),
  createType: Joi.string()
    .valid("Consultation", "Treatment")
    .required(),
  lineBills: Joi.array()
    .items(linebillItemSchema)
    .min(1)
    .required()
});

const treatmentBookAppointmentSchema = Joi.object({
  date: Joi.string()
    .max(100)
    .required(),
  doctorId: Joi.number()
    .integer()
    .required(),
  treatmentCycleId: Joi.number()
    .integer()
    .required()
    .allow(null),
  timeStart: Joi.string()
    .max(10)
    .required(),
  timeEnd: Joi.string()
    .max(10)
    .required(),
  appointmentReasonId: Joi.number()
    .integer()
    .required(),
  branchId: Joi.number()
    .integer()
    .required()
});

const treatmentSheetUpdateSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required()
    .allow(null),
  template: Joi.string().required()
});

const consultationBookReviewAppointmentSchema = Joi.object({
  currentAppointmentId: Joi.number().required(),
  type: Joi.string()
    .valid("Consultation", "Treatment")
    .required(),
  date: Joi.string()
    .max(100)
    .required(),
  doctorId: Joi.number()
    .integer()
    .required(),
  timeStart: Joi.string()
    .max(10)
    .required(),
  timeEnd: Joi.string()
    .max(10)
    .required(),
  patientId: Joi.number()
    .integer()
    .required(),
  appointmentReasonId: Joi.number()
    .integer()
    .required(),
  branchId: Joi.number()
    .integer()
    .required()
});

const treatmentBookReviewAppointmentSchema = Joi.object({
  currentAppointmentId: Joi.number().required(),
  type: Joi.string()
    .valid("Consultation", "Treatment")
    .required(),
  date: Joi.string()
    .max(100)
    .required(),
  doctorId: Joi.number()
    .integer()
    .required(),
  treatmentCycleId: Joi.number()
    .integer()
    .required(),
  appointmentReasonId: Joi.number()
    .integer()
    .required(),
  branchId: Joi.number()
    .integer()
    .required(),
  hasAnyFuturePrescription: Joi.boolean().optional(),
  lineBillEntries: Joi.alternatives().conditional("hasAnyFuturePrescription", {
    is: Joi.exist(), // If 'hasAnyFuturePrescription' exists
    then: Joi.array()
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
      .required(), // Required if hasAnyFuturePrescription exists
    otherwise: Joi.array()
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
      .optional() // Optional if hasAnyFuturePrescription is not given
  })
});

const updateTreatmentStatusSchema = Joi.object({
  visitId: Joi.number().required(),
  treatmentType: Joi.number().required(),
  stage: Joi.string()
    .valid(
      "ICSI_START",
      "START_IUI",
      "START_OITI",
      "TRIGGER_START",
      "START_DONOR_TRIGGER",
      "START_HYSTEROSCOPY",
      "FET_START",
      "ERA_START",
      "END_ICSI",
      "END_IUI",
      "END_OITI",
      "END_FET",
      "END_ERA"
    )
    .required(),
  triggerTime: Joi.when("stage", {
    is: Joi.valid("TRIGGER_START", "START_DONOR_TRIGGER"),
    then: Joi.date()
      .iso()
      .required(),
    otherwise: Joi.forbidden()
  }),
  hysteroscopyTime: Joi.when("stage", {
    is: "START_HYSTEROSCOPY",
    then: Joi.date()
      .iso()
      .required(),
    otherwise: Joi.forbidden()
  }),
  endedReason: Joi.when("stage", {
    is: Joi.valid("END_ICSI", "END_IUI", "END_OITI"),
    then: Joi.string().required(),
    otherwise: Joi.forbidden()
  }),
  fetEndedReason: Joi.when("stage", {
    is: "END_FET",
    then: Joi.string().required(),
    otherwise: Joi.forbidden()
  })
});

const deleteAppointmentSchema = Joi.object({
  appointmentId: Joi.number()
    .integer()
    .required(),
  type: Joi.string().required()
});

const noShowSchema = Joi.object({
  appointmentId: Joi.number()
    .integer()
    .required(),
  type: Joi.string().required(),
  noShowReason: Joi.string().required()
});

const hysteroscopyUpdateSheetSchema = Joi.object({
  visitId: Joi.number()
    .integer()
    .required(),
  hysteroscopyTemplate: Joi.string().required()
});

const printPrescriptionSchema = Joi.object({
  appointmentId: Joi.number()
    .integer()
    .required(),
  type: Joi.string().required(),
  isSpouse: Joi.number().required()
});

const applyOptOutScema = Joi.object({
  id: Joi.array().required(),
  type: Joi.string().required(),
  isOptOut: Joi.number().required()
});

const rescheduleAppointmentSchema = Joi.object({
  type: Joi.string().required(),
  consultationDoctorId: Joi.number().required(),
  timeStart: Joi.string()
    .max(10)
    .required(),
  timeEnd: Joi.string()
    .max(10)
    .required(),
  id: Joi.number().required(),
  appointmentDate: Joi.string().required()
});

const createOtherAppointmentSchema = Joi.object({
  appointmentReasonName: Joi.string().required(),
  patientId: Joi.number().required(),
  isSpouse: Joi.number()
    .valid(0, 1)
    .optional()
    .default(0)
});

module.exports = {
  consultationGetAvailableDoctorsSchema,
  consultationGetAvailableSlotsSchema,
  consultationBookAppointmentSchema,
  changeStatusSchema,
  getAppointmentsByIdSchema,
  lineBillSchema,
  linebillItemSchema,
  treatmentBookAppointmentSchema,
  treatmentSheetUpdateSchema,
  consultationBookReviewAppointmentSchema,
  treatmentBookReviewAppointmentSchema,
  updateTreatmentStatusSchema,
  deleteAppointmentSchema,
  noShowSchema,
  hysteroscopyUpdateSheetSchema,
  printPrescriptionSchema,
  applyOptOutScema,
  rescheduleAppointmentSchema,
  createOtherAppointmentSchema
};
