const createError = require("http-errors");

const EXPENSE_DELETE_ALLOWED_EMAILS = [
  "nikhilsuvva77@gmail.com",
  "ajaysivaramburri@gmail.com"
];

function hasExpenseDeleteAccess(userDetails) {
  if (!userDetails?.email) {
    return false;
  }

  const email = userDetails.email.trim().toLowerCase();
  return EXPENSE_DELETE_ALLOWED_EMAILS.includes(email);
}

function assertExpenseDeleteAccess(request) {
  if (!hasExpenseDeleteAccess(request.userDetails)) {
    throw new createError.Forbidden(
      "You do not have permission to delete expenses."
    );
  }
}

module.exports = {
  EXPENSE_DELETE_ALLOWED_EMAILS,
  hasExpenseDeleteAccess,
  assertExpenseDeleteAccess
};
