const createError = require("http-errors");
const BranchMasterModel = require("../models/Master/branchMaster");
const Constants = require("./constants");

const ALL_BRANCHES_ACCESS_EMAILS = [
  "nikhilsuvva77@gmail.com",
  "ajaysivaramburri@gmail.com"
].map(e => e.toLowerCase());

function hasAllBranchesAccess(email) {
  if (!email || typeof email !== "string") return false;
  return ALL_BRANCHES_ACCESS_EMAILS.includes(email.trim().toLowerCase());
}

let cachedAllBranches = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getAllBranchesDetails() {
  const now = Date.now();
  if (cachedAllBranches && now - cacheTime < CACHE_TTL_MS) {
    return cachedAllBranches;
  }

  const branchesList = await BranchMasterModel.findAll({}).catch(err => {
    console.log("error while fetching all branches for access", err);
    throw new createError.InternalServerError(
      Constants.SOMETHING_ERROR_OCCURRED
    );
  });

  cachedAllBranches = branchesList.map(branch => {
    const { id, name, branchCode } = branch.dataValues;
    return { id, name, branchCode: branchCode || null };
  });
  cacheTime = now;
  return cachedAllBranches;
}

async function enrichUserWithAllBranches(userInfo) {
  if (!userInfo || !hasAllBranchesAccess(userInfo.email)) {
    return userInfo;
  }
  userInfo.branchDetails = await getAllBranchesDetails();
  return userInfo;
}

module.exports = {
  ALL_BRANCHES_ACCESS_EMAILS,
  hasAllBranchesAccess,
  getAllBranchesDetails,
  enrichUserWithAllBranches
};
