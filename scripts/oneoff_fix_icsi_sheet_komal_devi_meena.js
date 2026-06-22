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

function buildDefaultIcsiTemplate(startDateYYYYMMDD) {
  const follicularRows = [
    { value: "<=10", label: "<=10", color: "light" },
    { value: "10.5", label: "10.5", color: "light" },
    { value: "11", label: "11", color: "light" },
    { value: "11.5", label: "11.5", color: "light" },
    { value: "12", label: "12", color: "light" },
    { value: "12.5", label: "12.5", color: "light" },
    { value: "13", label: "13", color: "light" },
    { value: "13.5", label: "13.5", color: "light" },
    { value: "14", label: "14", color: "medium" },
    { value: "14.5", label: "14.5", color: "medium" },
    { value: "15", label: "15", color: "medium" },
    { value: "15.5", label: "15.5", color: "medium" },
    { value: "16", label: "16", color: "medium" },
    { value: "16.5", label: "16.5", color: "medium" },
    { value: "17", label: "17", color: "medium" },
    { value: "17.5", label: "17.5", color: "dark" },
    { value: "18", label: "18", color: "dark" },
    { value: "18.5", label: "18.5", color: "dark" },
    { value: "19", label: "19", color: "dark" },
    { value: "19.5", label: "19.5", color: "dark" },
    { value: ">=20", label: ">=20", color: "dark" },
    { value: "ET", label: "ET", color: "extra-dark" }
  ];
  const scanRows = [
    { value: "E2", label: "E2" },
    { value: "P4", label: "P4" },
    { value: "LH", label: "LH" },
    { value: "UPT", label: "UPT" },
    { value: "B-HCG", label: "B-HCG" }
  ];
  return {
    columns: generateDateRange(startDateYYYYMMDD, 15),
    follicularSheet: {},
    medicationRows: [],
    medicationSheet: {},
    rows: follicularRows,
    scanRows,
    scanSheet: {}
  };
}

async function main() {
  const TARGET_FIRST_NAME = "Devi meena ";
  const TARGET_LAST_NAME = "Komal";
  const DAY1_DATE = "2026-06-12";

  await MySqlConnection.createConnection();
  const sequelize = MySqlConnection._instance;
  if (!sequelize) throw new Error("MySQL connection not initialized");

  const PatientMasterModel = require("../models/Master/patientMaster");
  const VisitAssociation = require("../models/Associations/patientVisitsAssociation");
  const VisitTreatmentsAssociations = require("../models/Associations/visitTreatmentsAssociations");
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
      `Expected exactly 1 patient match for ${TARGET_LAST_NAME} ${TARGET_FIRST_NAME.trim()}, found ${
        patientRows.length
      }. Aborting.`
    );
  }
  const patient = patientRows[0];

  const activeVisit = await VisitAssociation.findOne({
    where: { patientId: patient.id, isActive: 1 },
    attributes: ["id", "patientId", "isActive"]
  });
  if (!activeVisit) {
    throw new Error(
      `No active visit found for patient ${
        patient.patientId
      } (${TARGET_LAST_NAME} ${TARGET_FIRST_NAME.trim()}).`
    );
  }

  const treatmentCycle = await VisitTreatmentsAssociations.findOne({
    where: { visitId: activeVisit.id, treatmentTypeId: 6 },
    order: [["createdAt", "DESC"]],
    attributes: ["id", "visitId", "treatmentTypeId"]
  });
  if (!treatmentCycle) {
    throw new Error(
      `No ICSI Donor Oocyte + Self Sperm cycle (type 6) for active visitId=${activeVisit.id}.`
    );
  }

  const tx = await sequelize.transaction();
  try {
    const sheet = await TreatmentSheetsAssociationModel.findOne({
      where: { treatmentCycleId: treatmentCycle.id },
      attributes: ["id", "treatmentCycleId", "template"],
      transaction: tx
    });

    if (!sheet) {
      await TreatmentSheetsAssociationModel.create(
        {
          treatmentCycleId: treatmentCycle.id,
          template: JSON.stringify(buildDefaultIcsiTemplate(DAY1_DATE))
        },
        { transaction: tx }
      );
      console.log(
        `Created treatment sheet for treatmentCycleId=${treatmentCycle.id} with Day 1 column 12/06.`
      );
    } else {
      console.log(
        `Treatment sheet already exists for treatmentCycleId=${treatmentCycle.id}. Skipping create.`
      );
    }

    await tx.commit();
    console.log("Done.");
    console.log(
      `Patient: ${
        patient.patientId
      } (${TARGET_LAST_NAME} ${TARGET_FIRST_NAME.trim()})`
    );
    console.log(`Active visitId: ${activeVisit.id}`);
    console.log(
      `TreatmentCycleId: ${treatmentCycle.id} (type ${treatmentCycle.treatmentTypeId})`
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
