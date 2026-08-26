const moment = require("moment-timezone");

const FERTILITY_VISIT_TYPE_ID = 1;
const FERTILITY_CONSULTATION_FEE_VALIDITY_MONTHS = 3;
const TIMEZONE = "Asia/Kolkata";

const isFertilityVisit = (visitType, visitTypeId) => {
  if (Number(visitTypeId) === FERTILITY_VISIT_TYPE_ID) {
    return true;
  }

  const name = String(visitType || "")
    .toLowerCase()
    .trim();
  return name.startsWith("fe") || name.includes("fertility");
};

const getToday = () =>
  moment()
    .tz(TIMEZONE)
    .startOf("day");

const getPaidOn = orderDate =>
  moment(orderDate)
    .tz(TIMEZONE)
    .startOf("day");

const buildConsultationFeeExpiry = lastPayment => {
  if (!lastPayment?.orderDate) {
    return {
      paymentSince: null,
      isExpired: true,
      expiresOn: null,
      validityPeriod: lastPayment?.validityPeriod ?? null
    };
  }

  const today = getToday();
  const paidOn = getPaidOn(lastPayment.orderDate);
  const paymentSince = today.diff(paidOn, "days");
  const configuredValidity = Number(lastPayment.validityPeriod);

  let expiresOn = null;
  let effectiveValidityPeriod = configuredValidity;

  if (isFertilityVisit(lastPayment.visitType, lastPayment.patientTypeId)) {
    expiresOn = paidOn
      .clone()
      .add(FERTILITY_CONSULTATION_FEE_VALIDITY_MONTHS, "months");
    effectiveValidityPeriod = expiresOn.diff(paidOn, "days");
  } else if (Number.isFinite(configuredValidity) && configuredValidity >= 0) {
    expiresOn = paidOn.clone().add(configuredValidity, "days");
  }

  return {
    paymentSince,
    isExpired: !expiresOn || !today.isBefore(expiresOn),
    expiresOn: expiresOn ? expiresOn.format("YYYY-MM-DD") : null,
    validityPeriod: Number.isFinite(effectiveValidityPeriod)
      ? effectiveValidityPeriod
      : lastPayment.validityPeriod
  };
};

module.exports = {
  FERTILITY_VISIT_TYPE_ID,
  FERTILITY_CONSULTATION_FEE_VALIDITY_MONTHS,
  isFertilityVisit,
  buildConsultationFeeExpiry
};
