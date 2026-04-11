const PHARMACY_SALES_REPORT_ALLOWED_EMAILS = ["nikhilsuvva77@gmail.com"].map(
  e => e.toLowerCase()
);

function isPharmacySalesReportViewer(email) {
  if (!email || typeof email !== "string") return false;
  return PHARMACY_SALES_REPORT_ALLOWED_EMAILS.includes(
    email.trim().toLowerCase()
  );
}

module.exports = {
  PHARMACY_SALES_REPORT_ALLOWED_EMAILS,
  isPharmacySalesReportViewer
};
