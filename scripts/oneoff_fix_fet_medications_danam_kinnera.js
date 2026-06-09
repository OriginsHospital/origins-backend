/* eslint-disable no-console */
require("dotenv").config();

const MySqlConnection = require("../connections/mysql_connection");

const DEFAULT_FET_MEDICATION_ROWS = [
  { label: "Endofert-H", value: "Endofert-H" },
  { label: "ESTRABET GEL", value: "ESTRABET GEL" },
  { label: "ASVIT-E", value: "ASVIT-E" },
  { label: "Nicardia retard 20 mg tab", value: "Nicardia retard 20 mg tab" },
  { label: "BIFOLATE", value: "BIFOLATE" },
  { label: "PREGNASURE", value: "PREGNASURE" },
  { label: "DOLONEX DT 20MG TAB", value: "DOLONEX DT 20MG TAB" },
  { label: "SUSTEN 100 INJ", value: "SUSTEN 100 INJ" },
  { label: "MICHELLE 200 TAB", value: "MICHELLE 200 TAB" },
  { label: "DYDROPREG", value: "DYDROPREG" }
];

function mergeMedicationRows(existingRows, additions) {
  const merged = Array.isArray(existingRows) ? [...existingRows] : [];
  additions.forEach(row => {
    const exists = merged.some(
      item => item?.label === row.label || item?.value === row.value
    );
    if (!exists) {
      merged.push(row);
    }
  });
  return merged;
}

async function main() {
  const TARGET_FIRST_NAME = "Kinnera";
  const TARGET_LAST_NAME = "Danam";

  await MySqlConnection.createConnection();
  const sequelize = MySqlConnection._instance;
  if (!sequelize) throw new Error("MySQL connection not initialized");

  const PatientMasterModel = require("../models/Master/patientMaster");
  const VisitAssociation = require("../models/Associations/patientVisitsAssociation");
  const VisitTreatmentsAssociations = require("../models/Associations/visitTreatmentsAssociations");
  const TreatmentFetSheetAssociations = require("../models/Associations/treatmentFetSheetsAssociations");
  const { Op } = require("sequelize");

  const patientRows = await PatientMasterModel.findAll({
    where: {
      firstName: { [Op.like]: `%${TARGET_FIRST_NAME}%` },
      lastName: { [Op.like]: `%${TARGET_LAST_NAME}%` }
    },
    attributes: ["id", "patientId", "firstName", "lastName"],
    limit: 5
  });

  if (patientRows.length !== 1) {
    throw new Error(
      `Expected exactly 1 patient match for ${TARGET_LAST_NAME} ${TARGET_FIRST_NAME}, found ${patientRows.length}. Aborting.`
    );
  }
  const patient = patientRows[0];

  const activeVisit = await VisitAssociation.findOne({
    where: { patientId: patient.id, isActive: 1 },
    attributes: ["id", "patientId", "isActive"]
  });
  if (!activeVisit) {
    throw new Error(
      `No active visit found for patient ${patient.patientId} (${TARGET_LAST_NAME} ${TARGET_FIRST_NAME}).`
    );
  }

  const treatmentCycle = await VisitTreatmentsAssociations.findOne({
    where: { visitId: activeVisit.id },
    order: [["createdAt", "DESC"]],
    attributes: ["id", "visitId", "treatmentTypeId"]
  });
  if (!treatmentCycle) {
    throw new Error(`No treatment cycle found for visitId=${activeVisit.id}.`);
  }

  const fetSheet = await TreatmentFetSheetAssociations.findOne({
    where: { treatmentCycleId: treatmentCycle.id },
    attributes: ["id", "treatmentCycleId", "template"]
  });
  if (!fetSheet) {
    throw new Error(
      `No FET sheet found for treatmentCycleId=${treatmentCycle.id}.`
    );
  }

  const prescribedMeds = await sequelize.query(
    `
    select
      (select im.itemName from stockmanagement.item_master im where im.id = billTypeValue) as itemName,
      MAX(prescriptionDetails) as prescriptionDetails,
      MAX(prescriptionDays) as prescriptionDays
    from (
      select
        talba.billTypeValue,
        talba.prescriptionDetails,
        talba.prescriptionDays
      from treatment_appointment_line_bills_associations talba
      inner join treatment_appointments_associations taa on taa.id = talba.appointmentId
      where taa.treatmentCycleId = :treatmentCycleId
        and talba.isSpouse = 0
        and talba.billTypeId = 3
    ) prescriptionDetails
    group by billTypeValue
    `,
    {
      replacements: { treatmentCycleId: treatmentCycle.id },
      type: sequelize.QueryTypes.SELECT
    }
  );

  const prescribedRows = prescribedMeds
    .filter(item => item.itemName)
    .map(item => ({ label: item.itemName, value: item.itemName }));

  const parsed = JSON.parse(fetSheet.template);
  const existingRows = Array.isArray(parsed.medicationRows)
    ? parsed.medicationRows
    : Array.isArray(parsed.medicationSheet?.rows)
    ? parsed.medicationSheet.rows
    : [];

  const mergedRows = mergeMedicationRows(
    mergeMedicationRows(existingRows, DEFAULT_FET_MEDICATION_ROWS),
    prescribedRows
  );

  const medicationSheet =
    parsed.medicationSheet &&
    typeof parsed.medicationSheet === "object" &&
    !Array.isArray(parsed.medicationSheet)
      ? { ...parsed.medicationSheet, rows: mergedRows }
      : { rows: mergedRows };

  parsed.medicationRows = mergedRows;
  parsed.medicationSheet = medicationSheet;

  const tx = await sequelize.transaction();
  try {
    const [sheetUpdated] = await TreatmentFetSheetAssociations.update(
      { template: JSON.stringify(parsed) },
      { where: { id: fetSheet.id }, transaction: tx }
    );
    if (sheetUpdated !== 1) {
      throw new Error(
        `treatment_fetsheet_associations update affected ${sheetUpdated} rows (expected 1).`
      );
    }

    await tx.commit();
    console.log("Done.");
    console.log(
      `Patient: ${patient.patientId} (${patient.lastName.trim()} ${
        patient.firstName
      })`
    );
    console.log(`Active visitId: ${activeVisit.id}`);
    console.log(`TreatmentCycleId: ${treatmentCycle.id}`);
    console.log(`Medication rows before: ${existingRows.length}`);
    console.log(`Medication rows after: ${mergedRows.length}`);
    console.log("Medications:", mergedRows.map(row => row.label).join(", "));
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    await sequelize.close().catch(() => {});
  }
}

main().catch(err => {
  console.error("Failed:", err.message);
  process.exitCode = 1;
});
