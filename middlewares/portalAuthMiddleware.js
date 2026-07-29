const createError = require("http-errors");
const constants = require("../constants/constants");
const { asyncHandler } = require("./errorHandlers");
const PortalJwtHelper = require("../utils/portalJwtUtils");

const portalTokenVerified = asyncHandler(async (req, res, next) => {
  if (!req.headers["authorization"]) {
    return next(new createError.Unauthorized(constants.PROVIDE_TOKEN));
  }
  const token = req.headers["authorization"].split(" ")[1];
  if (!token) {
    return next(new createError.Unauthorized(constants.PROVIDE_TOKEN));
  }

  const jwt = new PortalJwtHelper();
  const decoded = await jwt.verifyAccessToken(token);
  const account = JSON.parse(decoded.aud);
  req.portalAccount = account;
  next();
});

const requireSuperAdmin = asyncHandler(async (req, res, next) => {
  if (!req.portalAccount || req.portalAccount.accountType !== "super_admin") {
    return next(new createError.Forbidden("Super admin access required"));
  }
  next();
});

const requirePatient = asyncHandler(async (req, res, next) => {
  if (!req.portalAccount || req.portalAccount.accountType !== "patient") {
    return next(new createError.Forbidden("Patient access required"));
  }
  if (!req.portalAccount.patientMasterId && !req.portalAccount.patientCode) {
    return next(new createError.Forbidden("Patient profile not linked"));
  }
  next();
});

module.exports = {
  portalTokenVerified,
  requireSuperAdmin,
  requirePatient
};
