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

async function main() {
  const TARGET_FIRST_NAME = "Prathibha";
  const TARGET_LAST_NAME = "Nambur";
  const NEW_DAY1_DATE = "2026-05-02"; // 02/05/YYYY (dd/mm) => 2 May 2026

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

  // ICSI treatment types appear as 4/5 in multiple queries (vtca.treatmentTypeId IN (4,5))
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
      parsed.columns = generateDateRange(NEW_DAY1_DATE, 15);

      const [sheetUpdated] = await TreatmentSheetsAssociationModel.update(
        { template: JSON.stringify(parsed) },
        { where: { id: sheet.id }, transaction: tx }
      );
      if (sheetUpdated !== 1) {
        throw new Error(
          `treatment_sheets_associations update affected ${sheetUpdated} rows (expected 1).`
        );
      }
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
    console.log(
      `ICSI Day 1 start date set to: ${NEW_DAY1_DATE} (shows as 02/05)`
    );
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
