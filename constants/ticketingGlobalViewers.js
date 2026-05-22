/**
 * Users who can view and manage all tickets (Issue Log) and tasks (Task Tracker)
 * across every assignee, not only their own.
 */
const TICKETING_GLOBAL_VIEWER_EMAILS = [
  "karun@gmail.com",
  "jhansi@gmail.com",
  "priyankaadmin@gmail.com"
].map(e => e.toLowerCase());

function isTicketingGlobalViewer(email) {
  if (!email || typeof email !== "string") return false;
  return TICKETING_GLOBAL_VIEWER_EMAILS.includes(email.trim().toLowerCase());
}

module.exports = {
  TICKETING_GLOBAL_VIEWER_EMAILS,
  isTicketingGlobalViewer
};
