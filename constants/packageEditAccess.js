const PACKAGE_EDIT_ALLOWED_EMAIL = "nikhilsuvva77@gmail.com";

function hasPackageEditAccess(email) {
  if (!email || typeof email !== "string") {
    return false;
  }
  return email.trim().toLowerCase() === PACKAGE_EDIT_ALLOWED_EMAIL;
}

function assertPackageEditAllowed(request) {
  const createError = require("http-errors");
  const Constants = require("./constants");

  if (!hasPackageEditAccess(request.userDetails?.email)) {
    throw new createError.Forbidden(Constants.PACKAGE_EDIT_FORBIDDEN);
  }
}

module.exports = {
  PACKAGE_EDIT_ALLOWED_EMAIL,
  hasPackageEditAccess,
  assertPackageEditAllowed
};
