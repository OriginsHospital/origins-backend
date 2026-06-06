const createError = require("http-errors");
const Constants = require("./constants");

const REFERRING_DOCTORS_LOG_ALLOWED_EMAILS = [
  "nikhilsuvva77@gmail.com",
  "ajaysivaramburri@gmail.com",
  "originsivf@outlook.com",
  "jhansi@gmail.com",
  "karun@gmail.com",
  "priyankaadmin@gmail.com"
];

function hasReferringDoctorsLogAccess(userDetails) {
  if (!userDetails?.email) {
    return false;
  }
  const email = userDetails.email.trim().toLowerCase();
  return REFERRING_DOCTORS_LOG_ALLOWED_EMAILS.includes(email);
}

function assertReferringDoctorsLogAccess(request) {
  if (!hasReferringDoctorsLogAccess(request.userDetails)) {
    throw new createError.Forbidden(
      "You do not have access to referring doctors logs."
    );
  }
}

module.exports = {
  REFERRING_DOCTORS_LOG_ALLOWED_EMAILS,
  hasReferringDoctorsLogAccess,
  assertReferringDoctorsLogAccess
};
