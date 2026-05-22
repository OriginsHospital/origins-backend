/* eslint-disable no-console */
require("dotenv").config();

const moment = require("moment-timezone");
const MySqlConnection = require("../connections/mysql_connection");

function generateDateRange(startDateYYYYMMDD, numberOfDates) {
  const dates = [];
  let current = moment.tz(startDateYYYYMMDD, "YYYY-MM-DD", "Asia/Kolkata");
  if (!current.isValid()) {
    throw new Error(`Invalid start date: ${startDateYYYYMMDD}`);
  }
  for (let i = 0; i < numberOfDates; i++) {
    dates.push(current.format("DD/MM"));
    current = current.add(1, "day");
  }
  return dates;
}

function remapSheetKeys(data, oldCols, newCols) {
  if (
    !data ||
    typeof data !== "object" ||
    !oldCols?.length ||
    !newCols?.length
  ) {
    return data;
  }

  const remapped = {};
  Object.entries(data).forEach(([key, value]) => {
    let newKey = key;
    for (let i = 0; i < oldCols.length; i++) {
      const oldCol = oldCols[i];
      const newCol = newCols[i];
      if (!oldCol || !newCol || oldCol === newCol) continue;
      if (key === `${oldCol}-note` || key.startsWith(`${oldCol}-`)) {
        newKey = key.replace(oldCol, newCol);
        break;
      }
    }
    remapped[newKey] = value;
  });
  return remapped;
}

async function main() {
  const TARGET_FIRST_NAME = "Renuka";
  const TARGET_LAST_NAME = "Begavath";
  const NEW_DAY1_DATE = "2026-04-21"; // Day 1 => 21/04, sequence follows daily

  await MySqlConnection.createConnection();
  const sequelize = MySqlConnection._instance;
  if (!sequelize) throw new Error("MySQL connection not initialized");

  const PatientMasterModel = require("../models/Master/patientMaster");
  const VisitAssociation = require("../models/Associations/patientVisitsAssociation");
  const VisitTreatmentsAssociations = require("../models/Associations/visitTreatmentsAssociations");
  const TreatmentFetSheetAssociations = require("../models/Associations/treatmentFetSheetsAssociations");

  const patientRows = await PatientMasterModel.findAll({
    where: {
      firstName: TARGET_FIRST_NAME,
      lastName: TARGET_LAST_NAME
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

  const treatmentCycles = await VisitTreatmentsAssociations.findAll({
    where: { visitId: activeVisit.id },
    order: [["createdAt", "DESC"]],
    attributes: ["id", "visitId", "treatmentTypeId"]
  });

  if (!treatmentCycles.length) {
    throw new Error(
      `No treatment cycles found for active visitId=${activeVisit.id}.`
    );
  }

  const cycleIds = treatmentCycles.map(tc => tc.id);
  const fetSheets = await TreatmentFetSheetAssociations.findAll({
    where: { treatmentCycleId: cycleIds },
    attributes: ["id", "treatmentCycleId", "template"]
  });

  if (!fetSheets.length) {
    throw new Error(
      `No FET sheet found for any treatment cycle on visitId=${activeVisit.id}.`
    );
  }

  const sheet =
    fetSheets.find(row => {
      try {
        const parsed = JSON.parse(row.template);
        const cols = Array.isArray(parsed.columns) ? parsed.columns : [];
        return cols[0] === "12/05";
      } catch {
        return false;
      }
    }) || fetSheets[0];

  if (
    fetSheets.length > 1 &&
    !fetSheets.some(row => {
      try {
        const parsed = JSON.parse(row.template);
        return parsed.columns?.[0] === "12/05";
      } catch {
        return false;
      }
    })
  ) {
    console.log(
      `Warning: multiple FET sheets (${fetSheets.length}); updating treatmentCycleId=${sheet.treatmentCycleId}.`
    );
  }

  const parsed = JSON.parse(sheet.template);
  const oldCols = Array.isArray(parsed.columns) ? parsed.columns : [];
  const columnCount = Math.max(oldCols.length, 14);
  const newCols = generateDateRange(NEW_DAY1_DATE, columnCount);

  parsed.columns = newCols;
  if (parsed.medicationSheet) {
    parsed.medicationSheet = remapSheetKeys(
      parsed.medicationSheet,
      oldCols,
      newCols
    );
  }
  if (parsed.scanSheet) {
    parsed.scanSheet = remapSheetKeys(parsed.scanSheet, oldCols, newCols);
  }

  const tx = await sequelize.transaction();
  try {
    const [sheetUpdated] = await TreatmentFetSheetAssociations.update(
      { template: JSON.stringify(parsed) },
      { where: { id: sheet.id }, transaction: tx }
    );
    if (sheetUpdated !== 1) {
      throw new Error(
        `treatment_fetsheet_associations update affected ${sheetUpdated} rows (expected 1).`
      );
    }

    await tx.commit();
    console.log("Done.");
    console.log(
      `Patient: ${patient.patientId} (${TARGET_LAST_NAME} ${TARGET_FIRST_NAME})`
    );
    console.log(`Active visitId: ${activeVisit.id}`);
    console.log(`TreatmentCycleId: ${sheet.treatmentCycleId}`);
    console.log("Old columns:", oldCols.join(", "));
    console.log("New columns:", newCols.join(", "));
    console.log(`FET Day 1 set to: ${NEW_DAY1_DATE} (shows as 21/04)`);
  } catch (e) {
    await tx.rollback();
    throw e;
  } finally {
    await sequelize.close().catch(() => {});
  }
}

main().catch(err => {
  console.error("Failed:", err.message);
  process.exitCode = 1;
});
