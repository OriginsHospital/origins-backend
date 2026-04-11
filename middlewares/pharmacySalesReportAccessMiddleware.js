const createError = require("http-errors");
const { asyncHandler } = require("./errorHandlers");
const constants = require("../constants/constants");
const {
  isPharmacySalesReportViewer
} = require("../constants/pharmacySalesReportAccess");

const requirePharmacySalesReportAccess = asyncHandler(
  async (req, res, next) => {
    const email = req.userDetails?.email;
    if (!isPharmacySalesReportViewer(email)) {
      return next(
        new createError.Forbidden(constants.UNAUTHORIZED_ACCESS_TOKEN)
      );
    }
    next();
  }
);

module.exports = { requirePharmacySalesReportAccess };
