const OtPersonDefaultMasterModel = require("../models/Master/personDefaultOtMasterModel");
const OTPersonMasterModel = require("../models/Master/otPersonMasterModel");

const DESIGNATION = {
  SURGEON: 1,
  ANESTHETIST: 2,
  OT_STAFF: 3,
  EMBRYOLOGIST: 4
};

const firstPersonId = value => {
  if (value == null || value === "") return "";
  return (
    String(value)
      .split(",")
      .map(part => part.trim())
      .find(Boolean) || ""
  );
};

const toPositiveInt = value => {
  const id = Number(firstPersonId(value));
  return Number.isInteger(id) && id > 0 ? id : null;
};

const personExists = async (id, transaction) => {
  if (!id) return false;
  const row = await OTPersonMasterModel.findByPk(id, {
    transaction,
    raw: true
  }).catch(() => null);
  return Boolean(row);
};

const findFallbackPersonId = async (designationId, transaction) => {
  const preferred = await OTPersonMasterModel.findOne({
    where: { designationId, isActive: 1 },
    order: [["id", "ASC"]],
    transaction,
    raw: true
  }).catch(() => null);
  if (preferred?.id) return preferred.id;

  const anyDesignation = await OTPersonMasterModel.findOne({
    where: { designationId },
    order: [["id", "ASC"]],
    transaction,
    raw: true
  }).catch(() => null);
  if (anyDesignation?.id) return anyDesignation.id;

  const anyActive = await OTPersonMasterModel.findOne({
    where: { isActive: 1 },
    order: [["id", "ASC"]],
    transaction,
    raw: true
  }).catch(() => null);
  if (anyActive?.id) return anyActive.id;

  const anyPerson = await OTPersonMasterModel.findOne({
    order: [["id", "ASC"]],
    transaction,
    raw: true
  }).catch(() => null);
  return anyPerson?.id || null;
};

const resolveRequiredPersonId = async (
  preferredValue,
  designationId,
  transaction
) => {
  const preferredId = toPositiveInt(preferredValue);
  if (await personExists(preferredId, transaction)) {
    return preferredId;
  }
  return findFallbackPersonId(designationId, transaction);
};

/**
 * Resolve OT staff from Admin → Default OT Persons for the branch.
 * anesthetistId and embryologistId are NOT NULL FK columns on ot_list_master,
 * so they must always be real ot_person_master ids (never 0).
 */
const getOtDefaultStaffForBranch = async (branchId, transaction) => {
  const resolvedBranchId = Array.isArray(branchId) ? branchId[0] : branchId;
  const empty = {
    surgeonId: "",
    anesthetistId: null,
    otStaff: "",
    embryologistId: null
  };
  if (!resolvedBranchId) return empty;

  const rows = await OtPersonDefaultMasterModel.findAll({
    where: { branchId: resolvedBranchId },
    transaction,
    raw: true
  }).catch(err => {
    console.log("Error while fetching default OT persons for branch", err);
    return [];
  });

  const byDesignation = {};
  (rows || []).forEach(row => {
    byDesignation[Number(row.designationId)] = row.personId || "";
  });

  const anesthetistId = await resolveRequiredPersonId(
    byDesignation[DESIGNATION.ANESTHETIST],
    DESIGNATION.ANESTHETIST,
    transaction
  );
  const embryologistId = await resolveRequiredPersonId(
    byDesignation[DESIGNATION.EMBRYOLOGIST],
    DESIGNATION.EMBRYOLOGIST,
    transaction
  );

  return {
    surgeonId: byDesignation[DESIGNATION.SURGEON] || "",
    anesthetistId,
    otStaff: byDesignation[DESIGNATION.OT_STAFF] || "",
    embryologistId
  };
};

module.exports = {
  getOtDefaultStaffForBranch
};
