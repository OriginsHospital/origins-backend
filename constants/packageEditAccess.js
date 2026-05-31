const createError = require("http-errors");
const Constants = require("./constants");

const PACKAGE_EDIT_ALLOWED_EMAIL = "nikhilsuvva77@gmail.com";
const PACKAGE_EDIT_ADMIN_ROLE_IDS = [1, 7];

function hasPackageEditAccess(userDetails) {
  if (!userDetails) {
    return false;
  }

  const email = userDetails.email?.trim()?.toLowerCase();
  if (email === PACKAGE_EDIT_ALLOWED_EMAIL) {
    return true;
  }

  const roleId = userDetails.roleDetails?.id;
  if (PACKAGE_EDIT_ADMIN_ROLE_IDS.includes(roleId)) {
    return true;
  }

  const roleName = userDetails.roleDetails?.name?.trim()?.toLowerCase();
  if (roleName === "admin") {
    return true;
  }

  return false;
}

function assertPackageEditAllowed(request) {
  if (!hasPackageEditAccess(request.userDetails)) {
    throw new createError.Forbidden(Constants.PACKAGE_EDIT_FORBIDDEN);
  }
}

module.exports = {
  PACKAGE_EDIT_ALLOWED_EMAIL,
  PACKAGE_EDIT_ADMIN_ROLE_IDS,
  hasPackageEditAccess,
  assertPackageEditAllowed
};
