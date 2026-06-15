const createError = require("http-errors");
const { Op } = require("sequelize");
const BranchMasterModel = require("../models/Master/branchMaster");
const UserModel = require("../models/Users/userModel");
const UserBranchAssociationModel = require("../models/Users/userBranchAssociation");
const Constants = require("./constants");

const ADMIN_ROLE_ID = 1;

const ALL_BRANCHES_ACCESS_EMAILS = [
  "nikhilsuvva77@gmail.com",
  "ajaysivaramburri@gmail.com"
].map(e => e.toLowerCase());

function hasAllBranchesAccess(email) {
  if (!email || typeof email !== "string") return false;
  return ALL_BRANCHES_ACCESS_EMAILS.includes(email.trim().toLowerCase());
}

function shouldReceiveAllBranches(userDetails) {
  if (!userDetails) return false;
  if (hasAllBranchesAccess(userDetails.email)) return true;
  return Number(userDetails.roleDetails?.id) === ADMIN_ROLE_ID;
}

let cachedAllBranches = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function invalidateBranchesCache() {
  cachedAllBranches = null;
  cacheTime = 0;
}

async function getAllBranchesDetails() {
  const now = Date.now();
  if (cachedAllBranches && now - cacheTime < CACHE_TTL_MS) {
    return cachedAllBranches;
  }

  const branchesList = await BranchMasterModel.findAll({
    where: { isActive: true },
    order: [["name", "ASC"]]
  }).catch(err => {
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
  if (!userInfo || !shouldReceiveAllBranches(userInfo)) {
    return userInfo;
  }
  userInfo.branchDetails = await getAllBranchesDetails();
  return userInfo;
}

async function grantNewBranchToEligibleUsers(branchId) {
  if (!branchId) return;

  const [adminUsers, allAccessUsers] = await Promise.all([
    UserModel.findAll({
      where: { roleId: ADMIN_ROLE_ID },
      attributes: ["id"]
    }),
    UserModel.findAll({
      where: {
        email: {
          [Op.in]: ALL_BRANCHES_ACCESS_EMAILS
        }
      },
      attributes: ["id"]
    })
  ]).catch(err => {
    console.log("error while fetching users for new branch access", err);
    throw new createError.InternalServerError(
      Constants.SOMETHING_ERROR_OCCURRED
    );
  });

  const userIds = new Set([
    ...adminUsers.map(user => user.id),
    ...allAccessUsers.map(user => user.id)
  ]);

  if (!userIds.size) return;

  const associations = [...userIds].map(userId => ({
    userId,
    branchId
  }));

  await UserBranchAssociationModel.bulkCreate(associations, {
    ignoreDuplicates: true
  }).catch(err => {
    console.log("error while granting new branch to users", err);
    throw new createError.InternalServerError(
      Constants.SOMETHING_ERROR_OCCURRED
    );
  });
}

module.exports = {
  ADMIN_ROLE_ID,
  ALL_BRANCHES_ACCESS_EMAILS,
  hasAllBranchesAccess,
  shouldReceiveAllBranches,
  invalidateBranchesCache,
  getAllBranchesDetails,
  enrichUserWithAllBranches,
  grantNewBranchToEligibleUsers
};
