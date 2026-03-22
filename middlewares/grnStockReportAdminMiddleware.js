const createError = require("http-errors");
const { asyncHandler } = require("./errorHandlers");
const constants = require("../constants/constants");
const { isGrnStockReportAdmin } = require("../constants/grnStockReportAdmins");

/**
 * Restricts route to GRN stock report admin emails (see grnStockReportAdmins.js).
 */
const requireGrnStockReportAdmin = asyncHandler(async (req, res, next) => {
  const email = req.userDetails?.email;
  if (!isGrnStockReportAdmin(email)) {
    return next(new createError.Forbidden(constants.UNAUTHORIZED_ACCESS_TOKEN));
  }
  next();
});

module.exports = { requireGrnStockReportAdmin };
