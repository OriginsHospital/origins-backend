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
  const TARGET_FIRST_NAME = "Chandravathi";
  const TARGET_LAST_NAME = "Bhukya";
  const TARGET_PATIENT_ID = "KMM1288";
  const NEW_DAY1_DATE = "2026-05-17"; // 17/05

  await MySqlConnection.createConnection();
  const sequelize = MySqlConnection._instance;
  if (!sequelize) throw new Error("MySQL connection not initialized");

  const PatientMasterModel = require("../models/Master/patientMaster");
  const VisitAssociation = require("../models/Associations/patientVisitsAssociation");
  const VisitPackagesAssociation = require("../models/Associations/visitPackagesAssociation");
  const VisitTreatmentsAssociations = require("../models/Associations/visitTreatmentsAssociations");
  const TriggerTimeStampsMaster = require("../models/Master/triggerTimeStampsMaster");
  const TreatmentSheetsAssociationModel = require("../models/Associations/treatmentSheetsAssociations");

  const patientRows = await PatientMasterModel.findAll({
    where: {
      firstName: TARGET_FIRST_NAME,
      lastName: TARGET_LAST_NAME,
      patientId: TARGET_PATIENT_ID
    },
    attributes: ["id", "patientId", "firstName", "lastName"],
    limit: 5
  });

  if (patientRows.length !== 1) {
    throw new Error(
      `Expected exactly 1 patient match for ${TARGET_LAST_NAME} ${TARGET_FIRST_NAME} (${TARGET_PATIENT_ID}), found ${patientRows.length}. Aborting.`
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
    where: { visitId: activeVisit.id, treatmentTypeId: [4, 5] },
    order: [["createdAt", "DESC"]],
    attributes: ["id", "visitId", "treatmentTypeId"]
  });
  if (!treatmentCycle) {
    throw new Error(
      `No ICSI treatment cycle found (type 4/5) for active visitId=${activeVisit.id}.`
    );
  }

  const tx = await sequelize.transaction();
  try {
    const [vpaUpdated] = await VisitPackagesAssociation.update(
      { day1Date: NEW_DAY1_DATE },
      { where: { visitId: activeVisit.id }, transaction: tx }
    );
    if (vpaUpdated !== 1) {
      throw new Error(
        `visit_packages_associations update affected ${vpaUpdated} rows (expected 1).`
      );
    }

    await TriggerTimeStampsMaster.update(
      { startDate: `${NEW_DAY1_DATE} 00:00:00` },
      {
        where: {
          visitId: activeVisit.id,
          treatmentType: treatmentCycle.treatmentTypeId
        },
        transaction: tx
      }
    );

    const sheet = await TreatmentSheetsAssociationModel.findOne({
      where: { treatmentCycleId: treatmentCycle.id },
      attributes: ["id", "treatmentCycleId", "template"],
      transaction: tx
    });

    if (!sheet) {
      console.log(
        `Warning: no treatment sheet found for treatmentCycleId=${treatmentCycle.id}. Only day1Date/startDate updated.`
      );
    } else {
      const parsed = JSON.parse(sheet.template);
      const oldCols = Array.isArray(parsed.columns) ? parsed.columns : [];
      const columnCount = Math.max(oldCols.length, 15);
      const newCols = generateDateRange(NEW_DAY1_DATE, columnCount);

      parsed.columns = newCols;
      if (parsed.follicularSheet) {
        parsed.follicularSheet = remapSheetKeys(
          parsed.follicularSheet,
          oldCols,
          newCols
        );
      }
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

      const [sheetUpdated] = await TreatmentSheetsAssociationModel.update(
        { template: JSON.stringify(parsed) },
        { where: { id: sheet.id }, transaction: tx }
      );
      if (sheetUpdated !== 1) {
        throw new Error(
          `treatment_sheets_associations update affected ${sheetUpdated} rows (expected 1).`
        );
      }
      console.log("Old Day 1 column:", oldCols[0]);
      console.log("New columns:", newCols.join(", "));
    }

    await tx.commit();
    console.log("Done.");
    console.log(
      `Patient: ${patient.patientId} (${TARGET_LAST_NAME} ${TARGET_FIRST_NAME})`
    );
    console.log(`Active visitId: ${activeVisit.id}`);
    console.log(
      `TreatmentCycleId: ${treatmentCycle.id} (type ${treatmentCycle.treatmentTypeId})`
    );
    console.log(`ICSI Day 1 set to: ${NEW_DAY1_DATE} (shows as 17/05)`);
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
