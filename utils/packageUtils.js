const createError = require("http-errors");

const isNumericValue = value =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  !Number.isNaN(Number(value));

const getEffectivePackageAmount = packageData => {
  if (!packageData) {
    return null;
  }

  if (isNumericValue(packageData.marketingPackage)) {
    return Number(packageData.marketingPackage);
  }

  if (isNumericValue(packageData.doctorSuggestedPackage)) {
    return Number(packageData.doctorSuggestedPackage);
  }

  return null;
};

const assertPackageDefinedForConsent = packageData => {
  if (!packageData) {
    throw new createError.BadRequest(
      "Package not defined for this visit. Please configure the package first."
    );
  }

  const packageAmount = getEffectivePackageAmount(packageData);

  if (packageAmount === null) {
    throw new createError.BadRequest("Package Amount still not defined");
  }

  // Zero-amount packages are valid without a registration date (no payment milestone).
  if (packageAmount > 0 && !packageData.registrationDate) {
    throw new createError.BadRequest(
      "Package registration date is required before uploading consent forms"
    );
  }
};

module.exports = {
  assertPackageDefinedForConsent,
  getEffectivePackageAmount,
  isNumericValue
};
