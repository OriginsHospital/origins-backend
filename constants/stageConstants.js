const roleConstants = require("./roleConstants");

module.exports = {
  Booked: {
    prev: [],
    next: ["Scan", "Doctor", "Seen", "Done"],
    validNext: ["Scan"],
    numericFields: [],
    dateFields: [],
    hasAccess: []
  },
  Scan: {
    prev: ["Booked"],
    next: ["Doctor", "Seen", "Done"],
    validNext: ["Doctor"],
    numericFields: ["isScan"],
    dateFields: ["scanAt"],
    hasAccess: []
  },
  Doctor: {
    prev: ["Booked", "Scan"],
    next: ["Seen", "Done"],
    validNext: ["Seen"],
    numericFields: ["isDoctor"],
    dateFields: ["doctorAt"],
    hasAccess: []
  },
  Seen: {
    prev: ["Booked", "Scan", "Doctor"],
    next: ["Done"],
    validNext: ["Done"],
    numericFields: ["isSeen"],
    dateFields: ["seenAt"],
    hasAccess: []
  },
  Done: {
    prev: ["Booked", "Scan", "Doctor", "Seen"],
    next: [],
    validNext: [],
    numericFields: ["isDone"],
    dateFields: ["doneAt"],
    hasAccess: []
  }
};
