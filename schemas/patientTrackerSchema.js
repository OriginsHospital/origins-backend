const Joi = require("@hapi/joi");

const treatmentTypeValues = ["IVF", "OI-TI", "IUI"];
const cycleStatusValues = [
  "Not Started",
  "Registered",
  "Running",
  "Complete",
  "Cancelled"
];
const uptResultValues = ["Positive", "Negative", "Others", null, ""];

const trackerBodySchema = {
  date: Joi.date().required(),
  branchId: Joi.number()
    .integer()
    .required(),
  patientId: Joi.string()
    .max(100)
    .required(),
  patientName: Joi.string()
    .max(255)
    .required(),
  mobileNumber: Joi.string()
    .max(15)
    .allow(null, "")
    .optional(),
  referralSourceId: Joi.number()
    .integer()
    .allow(null)
    .optional(),
  referralName: Joi.string()
    .max(255)
    .allow(null, "")
    .optional(),
  plan: Joi.string()
    .max(255)
    .allow(null, "")
    .optional(),
  treatmentType: Joi.string()
    .valid(...treatmentTypeValues)
    .required(),
  cycleStatus: Joi.string()
    .valid(...cycleStatusValues)
    .required(),
  stageOfCycle: Joi.string()
    .max(255)
    .allow(null, "")
    .optional(),
  packageName: Joi.string()
    .max(255)
    .allow(null, "")
    .optional(),
  packageAmount: Joi.number()
    .allow(null)
    .optional(),
  registrationAmount: Joi.number()
    .allow(null)
    .optional(),
  paidAmount: Joi.number()
    .allow(null)
    .optional(),
  pendingAmount: Joi.number()
    .allow(null)
    .optional(),
  icsiD1: Joi.date()
    .allow(null, "")
    .optional(),
  opu: Joi.date()
    .allow(null, "")
    .optional(),
  fetD1: Joi.date()
    .allow(null, "")
    .optional(),
  fet: Joi.date()
    .allow(null, "")
    .optional(),
  numberOfEmbryos: Joi.number()
    .integer()
    .allow(null)
    .optional(),
  numberOfEmbryosUsed: Joi.number()
    .integer()
    .allow(null)
    .optional(),
  numberOfEmbryosDiscarded: Joi.number()
    .integer()
    .allow(null)
    .optional(),
  lastRenewalDate: Joi.date()
    .allow(null, "")
    .optional(),
  embryosRemaining: Joi.number()
    .integer()
    .allow(null)
    .optional(),
  uptResult: Joi.string()
    .valid(...uptResultValues)
    .allow(null, "")
    .optional(),
  uptManualEntry: Joi.string()
    .max(255)
    .allow(null, "")
    .optional()
};

const createPatientTrackerSchema = Joi.object(trackerBodySchema);

const editPatientTrackerSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  ...trackerBodySchema
});

module.exports = {
  createPatientTrackerSchema,
  editPatientTrackerSchema
};
