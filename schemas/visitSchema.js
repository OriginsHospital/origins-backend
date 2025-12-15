const Joi = require("@hapi/joi");

const createVisitSchema = Joi.object({
  patientId: Joi.number().required(),
  type: Joi.number().required(),
  visitDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .required()
});

const editVisitSchema = Joi.object({
  id: Joi.number().required(),
  type: Joi.number().required(),
  visitDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  packageChosen: Joi.number().required()
});

const createConsultationOrTreatmentSchema = Joi.object({
  createType: Joi.string().required(),
  visitId: Joi.number().required(),
  type: Joi.string().required(),
  packageAmount: Joi.number().optional(),
  treatmentTypeId: Joi.number().when("createType", {
    is: "Treatment",
    then: Joi.number().required(),
    otherwise: Joi.number().optional()
  })
});

const createPackageSchema = Joi.object({
  visitId: Joi.number().required(),
  marketingPackage: Joi.number().required(),
  registrationDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  registrationAmount: Joi.number().required(),
  day1Date: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null),
  day1Amount: Joi.number().required(),
  pickUpDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null),
  pickUpAmount: Joi.number().required(),
  hysteroscopyDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null),
  hysteroscopyAmount: Joi.number().required(),
  day5FreezingDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null),
  day5FreezingAmount: Joi.number().required(),
  fetDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null),
  fetAmount: Joi.number().required(),
  eraDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null),
  eraAmount: Joi.number().required(),
  uptPositiveDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null),
  uptPositiveAmount: Joi.number().required()
});

const editPackageSchema = Joi.object({
  id: Joi.number().required(), // Primary key, required for editing the package
  visitId: Joi.number().required(),
  marketingPackage: Joi.number().required(),
  registrationDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  registrationAmount: Joi.number().required(),
  day1Date: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .optional(),
  day1Amount: Joi.number().required(),
  pickUpDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .optional(),
  pickUpAmount: Joi.number().required(),
  hysteroscopyDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .optional(),
  hysteroscopyAmount: Joi.number().required(),
  day5FreezingDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .optional(),
  day5FreezingAmount: Joi.number().required(),
  fetDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .optional(),
  fetAmount: Joi.number().required(),
  eraDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .optional(),
  eraAmount: Joi.number().required(),
  uptPositiveDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .optional(),
  uptPositiveAmount: Joi.number().required()
});

const applyDiscountForPackageSchema = Joi.object({
  packageId: Joi.number().required(),
  discountAmount: Joi.number().required()
});

const saveDonarSchema = Joi.object({
  id: Joi.number()
    .integer()
    .optional(null, ""),
  visitId: Joi.number()
    .integer()
    .required(),
  patientId: Joi.number()
    .integer()
    .required(),
  treatmentTypeId: Joi.number()
    .integer()
    .required(),
  donarName: Joi.string()
    .max(255)
    .required(),
  age: Joi.number()
    .integer()
    .min(18)
    .max(100)
    .required(),
  mobileNumber: Joi.string()
    .optional()
    .allow(null, ""),
  kyc: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  marriageCertificate: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  birthCertificate: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  aadhaar: Joi.string()
    .optional()
    .allow(null, ""),
  donarPhotoUrl: Joi.string()
    .uri()
    .optional()
    .allow(null, ""),
  donarSignatureUrl: Joi.string()
    .uri()
    .optional()
    .allow(null, ""),
  bloodGroup: Joi.number()
    .integer()
    .required(),
  form24b: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  insuranceCertificate: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  spouseAadharCard: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  artBankCertificate: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  anaesthesiaConsent: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  form13: Joi.string()
    .max(255)
    .optional()
    .allow(null, "")
});

const editDonarSchema = Joi.object({
  id: Joi.number()
    .integer()
    .optional(null, ""),
  visitId: Joi.number()
    .integer()
    .required(),
  patientId: Joi.number()
    .integer()
    .required(),
  treatmentTypeId: Joi.number()
    .integer()
    .required(),
  donarName: Joi.string()
    .max(255)
    .required(),
  age: Joi.number()
    .integer()
    .min(18)
    .max(100)
    .required(),
  mobileNumber: Joi.string()
    .optional()
    .allow(null, ""),
  kyc: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  marriageCertificate: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  birthCertificate: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  aadhaar: Joi.string()
    .optional()
    .allow(null, ""),
  donarPhotoUrl: Joi.string()
    .uri()
    .optional()
    .allow(null, ""),
  donarSignatureUrl: Joi.string()
    .uri()
    .optional()
    .allow(null, ""),
  bloodGroup: Joi.number()
    .integer()
    .required(),
  form24b: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  insuranceCertificate: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  spouseAadharCard: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  artBankCertificate: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  anaesthesiaConsent: Joi.string()
    .max(255)
    .optional()
    .allow(null, ""),
  form13: Joi.string()
    .max(255)
    .optional()
    .allow(null, "")
});

const deleteDonorFileSchema = Joi.object({
  id: Joi.number().required(),
  visitId: Joi.number().required(),
  fileType: Joi.string()
    .valid(
      "marriageCertificate",
      "kyc",
      "birthCertificate",
      "aadhaar",
      "donarPhotoUrl",
      "donarSignatureUrl",
      "form24b",
      "insuranceCertificate",
      "spouseAadharCard",
      "artBankCertificate",
      "anaesthesiaConsent",
      "form13"
    )
    .required()
});

const closeVisitSchema = Joi.object({
  patientId: Joi.number().required(),
  type: Joi.string().required(),
  appointmentId: Joi.number().required(),
  treatmentCycleId: Joi.number().required(),
  visitClosedStatus: Joi.string()
    .valid("Completed", "Cancelled", "Closed")
    .required(),
  visitClosedReason: Joi.string().required()
});

const closeVisitByConsultationSchema = Joi.object({
  patientId: Joi.number().required(),
  type: Joi.string().required(),
  appointmentId: Joi.number().required(),
  consultationId: Joi.number().required(),
  visitClosedStatus: Joi.string()
    .valid("Completed", "Cancelled", "Closed")
    .required(),
  visitClosedReason: Joi.string().required()
});

const saveHysteroscopySchema = Joi.object({
  patientId: Joi.number()
    .integer()
    .required(),
  visitId: Joi.number()
    .integer()
    .required(),
  formType: Joi.string()
    .max(255)
    .allow(null, ""),
  clinicalDiagnosis: Joi.string()
    .max(255)
    .allow(null, ""),
  lmp: Joi.date().allow(null),
  dayOfCycle: Joi.string()
    .max(255)
    .allow(null, ""),
  admissionDate: Joi.date().allow(null),
  procedureDate: Joi.date().allow(null),
  dischargeDate: Joi.date().allow(null),
  procedureType: Joi.string()
    .max(255)
    .allow(null, ""),
  hospitalBranch: Joi.string()
    .max(255)
    .allow(null, ""),
  gynecologist: Joi.string()
    .max(255)
    .allow(null, ""),
  assistant: Joi.string()
    .max(255)
    .allow(null, ""),
  anesthesiaType: Joi.string()
    .max(255)
    .allow(null, ""),
  anesthetist: Joi.string()
    .max(255)
    .allow(null, ""),
  otAssistant: Joi.string()
    .max(255)
    .allow(null, ""),
  diagnosis: Joi.string()
    .max(255)
    .allow(null, ""),
  distensionMedia: Joi.string()
    .max(255)
    .allow(null, ""),
  entry: Joi.string()
    .max(255)
    .allow(null, ""),
  uterus: Joi.string()
    .max(255)
    .allow(null, ""),
  endometrialThickness: Joi.string()
    .max(255)
    .allow(null, ""),
  operativeFindings: Joi.string()
    .max(255)
    .allow(null, ""),
  intraopComplications: Joi.string()
    .max(255)
    .allow(null, ""),
  postopCourse: Joi.string()
    .max(255)
    .allow(null, ""),
  reviewOn: Joi.date().allow(null),
  dischargeMedications: Joi.string()
    .max(255)
    .allow(null, ""),
  consultantName: Joi.string()
    .max(255)
    .allow(null, "")
});

module.exports = {
  createVisitSchema,
  editVisitSchema,
  createConsultationOrTreatmentSchema,
  createPackageSchema,
  editPackageSchema,
  applyDiscountForPackageSchema,
  saveDonarSchema,
  editDonarSchema,
  closeVisitSchema,
  closeVisitByConsultationSchema,
  deleteDonorFileSchema,
  saveHysteroscopySchema
};
