/**
 * Rename fetus section labels in antenatal scan templates.
 *
 * Only updates these templates:
 * 1) TRIPLET EARLY ANTENATAL SCAN:
 *    TWIN A/B/C -> TRIPLET A/B/C
 * 2) QUADRUPLETS EARLY ANTENATAL SCAN:
 *    TWIN A/B/C/D -> QUADRUPLET A/B/C/D
 *
 * Usage:
 *   node scripts/renameAntenatalFetusLabels.js
 */

require("dotenv").config();
const { Sequelize } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");

const normalizeName = value =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const isTripletEarlyAntenatalScan = name => {
  const n = normalizeName(name);
  return (
    (n.includes("triplet") || n.includes("triple")) &&
    n.includes("early") &&
    n.includes("antenatal") &&
    n.includes("scan")
  );
};

const isQuadrupletsEarlyAntenatalScan = name => {
  const n = normalizeName(name);
  return (
    (n.includes("quadruplet") ||
      n.includes("quadruplets") ||
      n.includes("quad")) &&
    n.includes("early") &&
    n.includes("antenatal") &&
    n.includes("scan")
  );
};

function replaceTwinLabel(template, letter, newPrefix) {
  const pattern = new RegExp(`\\bTWIN\\s*${letter}\\b`, "gi");
  return template.replace(pattern, `${newPrefix} ${letter}`);
}

function relabelTripletTemplate(template) {
  let updated = template;
  updated = replaceTwinLabel(updated, "A", "TRIPLET");
  updated = replaceTwinLabel(updated, "B", "TRIPLET");
  updated = replaceTwinLabel(updated, "C", "TRIPLET");
  return updated;
}

function relabelQuadrupletsTemplate(template) {
  let updated = template;
  updated = replaceTwinLabel(updated, "A", "QUADRUPLET");
  updated = replaceTwinLabel(updated, "B", "QUADRUPLET");
  updated = replaceTwinLabel(updated, "C", "QUADRUPLET");
  updated = replaceTwinLabel(updated, "D", "QUADRUPLET");
  return updated;
}

async function updateTemplateByScanId(connection, scanId, updateFn, label) {
  const rows = await connection.query(
    `
    SELECT id, scanTemplate
    FROM scan_formats
    WHERE scanId = :scanId
    LIMIT 1
    `,
    {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { scanId }
    }
  );

  if (!rows?.[0]?.scanTemplate) {
    throw new Error(`Template not found in scan_formats for ${label}`);
  }

  const current = rows[0].scanTemplate;
  const updated = updateFn(current);

  await connection.query(
    `
    UPDATE scan_formats
    SET scanTemplate = :scanTemplate
    WHERE id = :id
    `,
    {
      type: Sequelize.QueryTypes.UPDATE,
      replacements: {
        id: rows[0].id,
        scanTemplate: updated
      }
    }
  );
}

async function renameAntenatalFetusLabels() {
  try {
    await MySqlConnection.createConnection();
    const connection = MySqlConnection._instance;

    if (!connection) {
      throw new Error("Failed to connect to database");
    }

    const scanRows = await connection.query(
      `
      SELECT id, name
      FROM scan_master
      WHERE LOWER(name) LIKE '%antenatal%'
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const tripletScan = scanRows.find(row =>
      isTripletEarlyAntenatalScan(row.name)
    );
    const quadrupletsScan = scanRows.find(row =>
      isQuadrupletsEarlyAntenatalScan(row.name)
    );

    if (!tripletScan?.id) {
      throw new Error("TRIPLET EARLY ANTENATAL SCAN not found in scan_master");
    }
    if (!quadrupletsScan?.id) {
      throw new Error(
        "QUADRUPLETS EARLY ANTENATAL SCAN not found in scan_master"
      );
    }

    await updateTemplateByScanId(
      connection,
      tripletScan.id,
      relabelTripletTemplate,
      "TRIPLET EARLY ANTENATAL SCAN"
    );
    console.log("Updated labels for TRIPLET EARLY ANTENATAL SCAN.");

    await updateTemplateByScanId(
      connection,
      quadrupletsScan.id,
      relabelQuadrupletsTemplate,
      "QUADRUPLETS EARLY ANTENATAL SCAN"
    );
    console.log("Updated labels for QUADRUPLETS EARLY ANTENATAL SCAN.");
  } catch (error) {
    console.error("Failed to rename antenatal fetus labels:", error.message);
    process.exitCode = 1;
  } finally {
    if (MySqlConnection._instance) {
      await MySqlConnection._instance.close();
    }
  }
}

if (require.main === module) {
  renameAntenatalFetusLabels();
}

module.exports = {
  renameAntenatalFetusLabels,
  relabelTripletTemplate,
  relabelQuadrupletsTemplate
};
