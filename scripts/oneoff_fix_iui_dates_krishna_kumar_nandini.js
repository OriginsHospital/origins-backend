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
  const TARGET_NAME = "krishna kumar nandini";
  const NEW_DAY1_DATE = "2026-05-03"; // 03/05 (3 May)

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
    attributes: ["id", "patientId", "firstName", "middleName", "lastName"],
    limit: 50
  });

  const patient = patientRows.find(row => {
    const fullName = [row.firstName, row.middleName, row.lastName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    return fullName === TARGET_NAME;
  });

  if (!patient) {
    throw new Error(`No patient found matching "${TARGET_NAME}". Aborting.`);
  }

  const activeVisit = await VisitAssociation.findOne({
    where: { patientId: patient.id, isActive: 1 },
    attributes: ["id", "patientId", "isActive"]
  });
  if (!activeVisit) {
    throw new Error(
      `No active visit found for patient ${patient.patientId} (${TARGET_NAME}).`
    );
  }

  const treatmentCycle = await VisitTreatmentsAssociations.findOne({
    where: { visitId: activeVisit.id, treatmentTypeId: [2, 3] },
    order: [["createdAt", "DESC"]],
    attributes: ["id", "visitId", "treatmentTypeId"]
  });
  if (!treatmentCycle) {
    throw new Error(
      `No IUI treatment cycle found (type 2/3) for active visitId=${activeVisit.id}.`
    );
  }

  const tx = await sequelize.transaction();
  try {
    const [vpaUpdated] = await VisitPackagesAssociation.update(
      { day1Date: NEW_DAY1_DATE },
      { where: { visitId: activeVisit.id }, transaction: tx }
    );
    if (vpaUpdated !== 1) {
      console.log(
        `Warning: visit_packages_associations update affected ${vpaUpdated} rows (expected 1).`
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
      console.log("Old columns:", oldCols.join(", "));
      console.log("New columns:", newCols.slice(0, 5).join(", "), "...");
    }

    await tx.commit();
    console.log("Done.");
    console.log(
      `Patient: ${patient.patientId} (${[
        patient.firstName,
        patient.middleName,
        patient.lastName
      ]
        .filter(Boolean)
        .join(" ")})`
    );
    console.log(`Active visitId: ${activeVisit.id}`);
    console.log(
      `TreatmentCycleId: ${treatmentCycle.id} (type ${treatmentCycle.treatmentTypeId})`
    );
    console.log(`IUI Day 1 set to: ${NEW_DAY1_DATE} (shows as 03/05)`);
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
