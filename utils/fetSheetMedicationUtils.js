const { Sequelize } = require("sequelize");

const DEFAULT_FET_MEDICATION_ROWS = [
  { label: "Endofert-H", value: "Endofert-H" },
  { label: "ESTRABET GEL", value: "ESTRABET GEL" },
  { label: "ASVIT-E", value: "ASVIT-E" },
  {
    label: "Nicardia retard 20 mg tab",
    value: "Nicardia retard 20 mg tab"
  },
  { label: "BIFOLATE", value: "BIFOLATE" },
  { label: "PREGNASURE", value: "PREGNASURE" },
  { label: "DOLONEX DT 20MG TAB", value: "DOLONEX DT 20MG TAB" },
  { label: "SUSTEN 100 INJ", value: "SUSTEN 100 INJ" },
  { label: "MICHELLE 200 TAB", value: "MICHELLE 200 TAB" },
  { label: "DYDROPREG", value: "DYDROPREG" }
];

const PRESCRIBED_MEDS_BY_CYCLE_QUERY = `
  select
    (select im.itemName from stockmanagement.item_master im where im.id = billTypeValue) as itemName
  from (
    select talba.billTypeValue
    from treatment_appointment_line_bills_associations talba
    inner join treatment_appointments_associations taa on taa.id = talba.appointmentId
    where taa.treatmentCycleId = :treatmentCycleId
      and talba.isSpouse = 0
      and talba.billTypeId = 3
    group by talba.billTypeValue
  ) prescriptionDetails
`;

function mergeMedicationRows(existingRows, additions) {
  const merged = Array.isArray(existingRows) ? [...existingRows] : [];
  const safeAdditions = Array.isArray(additions) ? additions : [];

  safeAdditions.forEach(row => {
    const label = row?.label || row?.value || row?.itemName;
    const value = row?.value || row?.label || row?.itemName;
    if (!label) return;

    const exists = merged.some(
      item => item?.label === label || item?.value === value
    );
    if (!exists) {
      merged.push({ label, value });
    }
  });

  return merged;
}

function getMedicationRowsFromTemplate(template) {
  if (!template || typeof template !== "object") {
    return [];
  }

  if (
    Array.isArray(template.medicationRows) &&
    template.medicationRows.length
  ) {
    return template.medicationRows;
  }

  if (
    template.medicationSheet &&
    typeof template.medicationSheet === "object" &&
    !Array.isArray(template.medicationSheet) &&
    Array.isArray(template.medicationSheet.rows)
  ) {
    return template.medicationSheet.rows;
  }

  return [];
}

function applyPrescribedMedicationsToFetTemplate(
  template,
  prescribedRows,
  options = {}
) {
  const { includeDefaults = false } = options;
  const parsed =
    typeof template === "string" ? JSON.parse(template) : { ...template };

  const existingRows = getMedicationRowsFromTemplate(parsed);
  let mergedRows = [...existingRows];

  if (includeDefaults) {
    mergedRows = mergeMedicationRows(mergedRows, DEFAULT_FET_MEDICATION_ROWS);
  }

  mergedRows = mergeMedicationRows(mergedRows, prescribedRows);

  const updated = mergedRows.length !== existingRows.length;

  parsed.medicationRows = mergedRows;
  parsed.medicationSheet =
    parsed.medicationSheet &&
    typeof parsed.medicationSheet === "object" &&
    !Array.isArray(parsed.medicationSheet)
      ? { ...parsed.medicationSheet, rows: mergedRows }
      : { rows: mergedRows };

  return { updated, template: parsed, medicationRows: mergedRows };
}

async function getPrescribedMedicationRowsForCycle(
  mysqlConnection,
  treatmentCycleId
) {
  if (!mysqlConnection || !treatmentCycleId) {
    return [];
  }

  const prescribedMeds = await mysqlConnection
    .query(PRESCRIBED_MEDS_BY_CYCLE_QUERY, {
      replacements: { treatmentCycleId },
      type: Sequelize.QueryTypes.SELECT
    })
    .catch(() => []);

  return prescribedMeds
    .filter(item => item?.itemName)
    .map(item => ({ label: item.itemName, value: item.itemName }));
}

module.exports = {
  DEFAULT_FET_MEDICATION_ROWS,
  mergeMedicationRows,
  getMedicationRowsFromTemplate,
  applyPrescribedMedicationsToFetTemplate,
  getPrescribedMedicationRowsForCycle
};
