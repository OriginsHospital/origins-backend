const OtPersonDefaultMasterModel = require("../models/Master/personDefaultOtMasterModel");

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

/**
 * Resolve OT staff from Admin → Default OT Persons for the branch.
 * Does not fall back to a hardcoded surgeon (e.g. Dr. Teja D).
 */
const getOtDefaultStaffForBranch = async (branchId, transaction) => {
  const empty = {
    surgeonId: "",
    anesthetistId: 0,
    otStaff: "",
    embryologistId: 0
  };
  if (!branchId) return empty;

  const rows = await OtPersonDefaultMasterModel.findAll({
    where: { branchId },
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

  const anesthetistId = firstPersonId(byDesignation[DESIGNATION.ANESTHETIST]);
  const embryologistId = firstPersonId(byDesignation[DESIGNATION.EMBRYOLOGIST]);

  return {
    surgeonId: byDesignation[DESIGNATION.SURGEON] || "",
    anesthetistId: anesthetistId ? Number(anesthetistId) : 0,
    otStaff: byDesignation[DESIGNATION.OT_STAFF] || "",
    embryologistId: embryologistId ? Number(embryologistId) : 0
  };
};

module.exports = {
  getOtDefaultStaffForBranch
};
