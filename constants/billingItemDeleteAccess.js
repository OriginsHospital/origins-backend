const createError = require("http-errors");

const BILLING_ITEM_DELETE_ALLOWED_EMAILS = [
  "ajaysivaramburri@gmail.com",
  "mokkagayathri09@gmail.com"
];

function hasBillingItemDeleteAccess(userDetails) {
  if (!userDetails?.email) {
    return false;
  }

  const email = userDetails.email.trim().toLowerCase();
  return BILLING_ITEM_DELETE_ALLOWED_EMAILS.includes(email);
}

function assertBillingItemDeleteAccess(request) {
  if (!hasBillingItemDeleteAccess(request.userDetails)) {
    throw new createError.Forbidden(
      "You do not have permission to delete billing items."
    );
  }
}

module.exports = {
  BILLING_ITEM_DELETE_ALLOWED_EMAILS,
  hasBillingItemDeleteAccess,
  assertBillingItemDeleteAccess
};
