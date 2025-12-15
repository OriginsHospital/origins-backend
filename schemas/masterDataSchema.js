const Joi = require("@hapi/joi");

const createLabTestSampleTypeSchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required(),
  isActive: Joi.number().required()
});

const editLabTestSampleTypeSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  name: Joi.string()
    .max(100)
    .required(),
  isActive: Joi.number().required()
});

const createLabTestGroupSchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required(),
  isActive: Joi.number().required()
});

const editLabTestGroupSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  name: Joi.string()
    .max(100)
    .required(),
  isActive: Joi.number().required()
});

const createLabTestSchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required(),
  branchId: Joi.number().required(),
  isActive: Joi.number().required(),
  isOutSourced: Joi.number().required(),
  labTestGroupId: Joi.number().required(),
  sampleTypeId: Joi.number().required(),
  amount: Joi.number().required()
});

const editLabTestSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  labTestId: Joi.number().required(),
  branchId: Joi.number().required(),
  name: Joi.string()
    .max(100)
    .required(),
  isOutSourced: Joi.number().required(),
  isActive: Joi.number().required(),
  labTestGroupId: Joi.number().required(),
  sampleTypeId: Joi.number().required(),
  amount: Joi.number().required()
});

const createScanSchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required(),
  branchId: Joi.number().required(),
  isActive: Joi.number().required(),
  isFormFRequired: Joi.number().required(),
  amount: Joi.number().required()
});

const editScanSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  scanId: Joi.number().required(),
  branchId: Joi.number().required(),
  name: Joi.string()
    .max(100)
    .required(),
  isFormFRequired: Joi.number().required(),
  isActive: Joi.number().required(),
  amount: Joi.number().required()
});

const createEmbryologySchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required(),
  branchId: Joi.number().required(),
  isActive: Joi.number().required(),
  amount: Joi.number().required()
});

const editEmbryologySchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  embryologyId: Joi.number().required(),
  branchId: Joi.number().required(),
  name: Joi.string()
    .max(100)
    .required(),
  isActive: Joi.number().required(),
  amount: Joi.number().required()
});

const addNewPharmacyItemSchema = Joi.object({
  itemName: Joi.string()
    .max(100)
    .required(),
  inventoryType: Joi.number()
    .integer()
    .required(),
  manufacturer: Joi.number()
    .integer()
    .allow(null, "")
    .optional(),
  hsnCode: Joi.string()
    .max(50)
    .allow(null, "")
    .optional(),
  categoryName: Joi.string()
    .max(100)
    .allow(null, "")
    .optional(),
  taxCategory: Joi.number()
    .integer()
    .required(),
  departmentId: Joi.number()
    .integer()
    .required(),
  isActive: Joi.number()
    .valid(0, 1)
    .allow(null)
    .optional(),
  createdBy: Joi.number()
    .integer()
    .allow(null)
    .optional()
});

const editPharmacyItemSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  itemName: Joi.string()
    .max(100)
    .optional(),
  inventoryType: Joi.number()
    .integer()
    .optional(),
  manufacturer: Joi.number()
    .integer()
    .allow(null)
    .optional(),
  hsnCode: Joi.string()
    .max(50)
    .allow(null, "")
    .optional(),
  categoryName: Joi.string()
    .max(100)
    .allow(null, "")
    .optional(),
  taxCategory: Joi.number()
    .integer()
    .optional(),
  departmentId: Joi.number()
    .integer()
    .required(),
  isActive: Joi.number()
    .valid(0, 1)
    .allow(null)
    .optional()
});

const createIncidentSchema = Joi.object({
  incidentDate: Joi.string()
    .max(100)
    .required(),
  description: Joi.string().required(),
  rootCauseAnalysis: Joi.string().required(),
  impact: Joi.string().required(),
  action: Joi.string().required(),
  preventiveMeasures: Joi.string().required(),
  responsibleEmployees: Joi.string().required(),
  isActive: Joi.number()
    .valid(0, 1)
    .allow(null)
    .optional()
});

const editIncidentSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  incidentDate: Joi.string()
    .max(100)
    .required(),
  description: Joi.string().required(),
  rootCauseAnalysis: Joi.string().required(),
  impact: Joi.string().required(),
  action: Joi.string().required(),
  preventiveMeasures: Joi.string().required(),
  responsibleEmployees: Joi.string().required(),
  isActive: Joi.number()
    .valid(0, 1)
    .allow(null)
    .optional()
});

const createDepartmentSchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required(),
  isActive: Joi.number()
    .valid(0, 1)
    .allow(null)
    .required()
});

const editDepartmentSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string()
    .max(100)
    .required(),
  isActive: Joi.number()
    .valid(0, 1)
    .allow(null)
    .required()
});

const createVendorSchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required(),
  departmentId: Joi.number().required(),
  isActive: Joi.number()
    .valid(0, 1)
    .allow(null)
    .required()
});

const editVendorSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string()
    .max(100)
    .required(),
  departmentId: Joi.number().required(),
  isActive: Joi.number()
    .valid(0, 1)
    .allow(null)
    .required()
});

const createSuppliesSchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required(),
  departmentId: Joi.number().required(),
  isActive: Joi.number()
    .valid(0, 1)
    .allow(null)
    .required()
});

const editSuppliesSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string()
    .max(100)
    .required(),
  departmentId: Joi.number().required(),
  isActive: Joi.number()
    .valid(0, 1)
    .allow(null)
    .required()
});

const createReferralSchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required(),
  isActive: Joi.number()
    .valid(0, 1)
    .allow(null)
    .required()
});

const editReferralsSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string()
    .max(100)
    .required(),
  isActive: Joi.number()
    .valid(0, 1)
    .allow(null)
    .required()
});

const createCitySchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required(),
  stateId: Joi.number().required(),
  isActive: Joi.number()
    .valid(0, 1)
    .allow(null)
    .required()
});

const editCitySchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string()
    .max(100)
    .required(),
  stateId: Joi.number().required(),
  isActive: Joi.number()
    .valid(0, 1)
    .allow(null)
    .required()
});

const saveOtDefaultPersonSchema = Joi.object({
  personId: Joi.string()
    .max(100)
    .required(),
  designationId: Joi.number().required(),
  branchId: Joi.number().required()
});

const editOtDefaultPersonSchema = Joi.object({
  id: Joi.number().required(),
  designationId: Joi.number().required(),
  branchId: Joi.number().required(),
  personId: Joi.string()
    .max(100)
    .required()
});

module.exports = {
  createLabTestGroupSchema,
  createLabTestSampleTypeSchema,
  editLabTestGroupSchema,
  editLabTestSampleTypeSchema,
  createLabTestSchema,
  editLabTestSchema,
  addNewPharmacyItemSchema,
  editPharmacyItemSchema,
  createIncidentSchema,
  editIncidentSchema,
  createDepartmentSchema,
  editDepartmentSchema,
  createVendorSchema,
  editVendorSchema,
  createSuppliesSchema,
  editSuppliesSchema,
  createReferralSchema,
  editReferralsSchema,
  createCitySchema,
  editCitySchema,
  createScanSchema,
  editScanSchema,
  createEmbryologySchema,
  editEmbryologySchema,
  saveOtDefaultPersonSchema,
  editOtDefaultPersonSchema
};
