module.exports = {
  ICSI_START: {
    checks: ["ICSI_CONSENTS_EXISTS", "ICSI_NOT_STARTED"],
    updates: "START_ICSI"
  },
  START_OITI: {
    checks: ["OITI_NOT_STARTED"],
    updates: "START_OITI"
  },
  START_IUI: {
    checks: ["IUI_CONSENTS_EXISTS", "IUI_NOT_STARTED"],
    updates: "START_IUI"
  },
  TRIGGER_START: {
    checks: {
      1: ["OITI_STARTED", "TRIGGER_NOT_STARTED"], //  OI TI
      2: ["IUI_STARTED", "TRIGGER_NOT_STARTED"], // IUI Self
      3: ["IUI_STARTED", "TRIGGER_NOT_STARTED"], //  IUI Donor
      4: ["ICSI_CONSENTS_EXISTS", "ICSI_STARTED", "TRIGGER_NOT_STARTED"], // ICSI
      5: ["ICSI_CONSENTS_EXISTS", "ICSI_STARTED", "TRIGGER_NOT_STARTED"], // ICSI Self Oocyte + Donor Sperm
      6: ["ICSI_CONSENTS_EXISTS", "ICSI_STARTED", "TRIGGER_NOT_STARTED"], // ICSI Donor Oocyte + Self Sperm
      7: ["ICSI_CONSENTS_EXISTS", "ICSI_STARTED", "TRIGGER_NOT_STARTED"] // ICSI Donor Oocyte + Donor Sperm
    },
    updates: "START_TRIGGER"
  },
  FET_START: {
    checks: ["FET_NOT_STARTED", "FET_CONSENTS_EXISTS"],
    updates: "START_FET"
  },
  ERA_START: {
    checks: ["ICSI_NOT_STARTED", "ERA_NOT_STARTED", "ERA_CONSENTS_EXISTS"],
    updates: "START_ERA"
  },
  END_ICSI: {
    checks: ["ICSI_CONSENTS_EXISTS", "ICSI_STARTED"],
    updates: "END_ICSI"
  },
  END_IUI: {
    checks: ["IUI_CONSENTS_EXISTS", "IUI_STARTED"],
    updates: "END_IUI"
  },
  END_OITI: {
    checks: ["OITI_STARTED"],
    updates: "END_OITI"
  },
  END_FET: {
    checks: ["FET_CONSENTS_EXISTS", "FET_STARTED"],
    updates: "END_FET"
  },
  START_HYSTEROSCOPY: {
    checks: {
      1: ["OITI_STARTED", "HYSTEROSCOPY_NOT_STARTED"], //  OI TI
      2: ["IUI_STARTED", "HYSTEROSCOPY_NOT_STARTED"], // IUI Self
      3: ["IUI_STARTED", "HYSTEROSCOPY_NOT_STARTED"], //  IUI Donor
      4: ["ICSI_CONSENTS_EXISTS", "ICSI_STARTED", "HYSTEROSCOPY_NOT_STARTED"], // ICSI
      5: ["ICSI_CONSENTS_EXISTS", "ICSI_STARTED", "HYSTEROSCOPY_NOT_STARTED"], // ICSI Self Oocyte + Donor Sperm
      6: ["ICSI_CONSENTS_EXISTS", "ICSI_STARTED", "HYSTEROSCOPY_NOT_STARTED"], // ICSI Donor Oocyte + Self Sperm
      7: ["ICSI_CONSENTS_EXISTS", "ICSI_STARTED", "HYSTEROSCOPY_NOT_STARTED"] // ICSI Donor Oocyte + Donor Sperm
    },
    updates: "START_HYSTEROSCOPY"
  },
  START_DONOR_TRIGGER: {
    checks: {
      1: [], //  OI TI
      2: [], // IUI Self
      3: [], //  IUI Donor
      4: [], // ICSI
      5: [], // ICSI Self Oocyte + Donor Sperm
      6: [
        "ICSI_CONSENTS_EXISTS",
        "TRIGGER_NOT_STARTED",
        "DONOR_PAYMENT_NOT_COMPLETED"
      ], // ICSI Donor Oocyte + Self Sperm
      7: [
        "ICSI_CONSENTS_EXISTS",
        "TRIGGER_NOT_STARTED",
        "DONOR_PAYMENT_NOT_COMPLETED"
      ] // ICSI Donor Oocyte + Donor Sperm
    },
    updates: "START_DONOR_TRIGGER"
  },
  PACKAGE_AMOUNT_PRODUCT_TYPE_MAPPING: [
    {
      columnName: "registrationAmount", // For Finding Amounts
      dateColumn: "registrationDate", // For Updating Dates
      productEnum: "REGISTRATION_FEE", // For storing productType
      displayName: "Registration Fee" // For showing in frontend
    },
    {
      columnName: "donorBookingAmount",
      dateColumn: "donorBookingDate",
      productEnum: "DONOR_BOOKING_AMOUNT",
      displayName: "Donor Booking"
    },
    {
      columnName: "day1Amount",
      dateColumn: "day1Date",
      productEnum: "DAY1_AMOUNT",
      displayName: "Day 1"
    },
    {
      columnName: "pickUpAmount",
      dateColumn: "pickUpDate",
      productEnum: "PICKUP_AMOUNT",
      displayName: "PickUp"
    },
    {
      columnName: "hysteroscopyAmount",
      dateColumn: "hysteroscopyDate",
      productEnum: "HYTEROSCOPY_AMOUNT",
      displayName: "Hysteroscropy"
    },
    {
      columnName: "day5FreezingAmount",
      dateColumn: "day5FreezingDate",
      productEnum: "DAY5FREEZING_AMOUNT",
      displayName: "Day 5 Freezing"
    },
    {
      columnName: "fetAmount",
      dateColumn: "fetDate",
      productEnum: "FET_AMOUNT",
      displayName: "FET"
    },
    {
      columnName: "eraAmount",
      dateColumn: "eraDate",
      productEnum: "ERA_AMOUNT",
      displayName: "ERA"
    },
    {
      columnName: "uptPositiveAmount",
      dateColumn: "uptPositiveDate",
      productEnum: "UPTPOSITIVE_AMOUNT",
      displayName: "UPT Positive"
    }
    // Add more milstones when required
  ]
};
