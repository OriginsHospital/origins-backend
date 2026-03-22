const GRN_STOCK_REPORT_ADMIN_EMAILS = [
  "nikhilsuvva77@gmail.com",
  "ajaysivaramburri@gmail.com"
].map(e => e.toLowerCase());

function isGrnStockReportAdmin(email) {
  if (!email || typeof email !== "string") return false;
  return GRN_STOCK_REPORT_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

module.exports = {
  GRN_STOCK_REPORT_ADMIN_EMAILS,
  isGrnStockReportAdmin
};
