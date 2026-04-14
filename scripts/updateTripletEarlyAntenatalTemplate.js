/**
 * Update TRIPLET EARLY ANTENATAL SCAN template.
 *
 * It clones the current TWINS EARLY ANTENATAL SCAN template
 * and appends a "TWIN C" block by copying the "TWIN B" block.
 *
 * Usage:
 *   node scripts/updateTripletEarlyAntenatalTemplate.js
 */

require("dotenv").config();
const { Sequelize } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");

const normalizeName = value =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const isTwinsEarlyAntenatalScan = name => {
  const n = normalizeName(name);
  return (
    n.includes("twin") &&
    n.includes("early") &&
    n.includes("antenatal") &&
    n.includes("scan")
  );
};

const isTripletEarlyAntenatalScan = name => {
  const n = normalizeName(name);
  return (
    (n.includes("triplet") || n.includes("triple")) &&
    n.includes("early") &&
    n.includes("antenatal") &&
    n.includes("scan")
  );
};

function buildTripletTemplateFromTwins(twinsTemplate) {
  if (!twinsTemplate || typeof twinsTemplate !== "string") {
    throw new Error("Invalid twins template");
  }

  if (/TWIN\s*C/i.test(twinsTemplate)) {
    return twinsTemplate;
  }

  const twinBMatch = /TWIN\s*B/i.exec(twinsTemplate);
  if (!twinBMatch || twinBMatch.index == null) {
    throw new Error("Could not find 'TWIN B' section in twins template");
  }

  // Duplicate full table rows of TWIN B to keep TWIN C tabular.
  const labelIndex = twinBMatch.index;
  const blockStart = twinsTemplate.lastIndexOf("<tr", labelIndex);
  if (blockStart === -1) {
    throw new Error("Could not find table row start for 'TWIN B'");
  }

  const afterLabel = twinsTemplate.slice(labelIndex);
  const nextSectionMatch = /(IMPRESSION|CONCLUSION|SUMMARY|COMMENTS|ADVICE|FINDINGS|REMARKS)\s*:?/i.exec(
    afterLabel
  );
  const nextSectionIndex =
    nextSectionMatch && nextSectionMatch.index != null
      ? labelIndex + nextSectionMatch.index
      : twinsTemplate.length;

  const lastTrEndBeforeSection = twinsTemplate.lastIndexOf(
    "</tr>",
    nextSectionIndex
  );
  if (lastTrEndBeforeSection === -1) {
    throw new Error("Could not find table row end for 'TWIN B' block");
  }
  const blockEnd = lastTrEndBeforeSection + "</tr>".length;

  const twinBBlock = twinsTemplate.slice(blockStart, blockEnd);
  const twinCBlock = twinBBlock.replace(/TWIN\s*B/gi, "TWIN C");

  if (twinCBlock === twinBBlock) {
    throw new Error("Failed to construct 'TWIN C' block");
  }

  return (
    twinsTemplate.slice(0, blockEnd) +
    twinCBlock +
    twinsTemplate.slice(blockEnd)
  );
}

async function updateTripletEarlyAntenatalTemplate() {
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
      {
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const twinsScan = scanRows.find(row => isTwinsEarlyAntenatalScan(row.name));
    const tripletScan = scanRows.find(row =>
      isTripletEarlyAntenatalScan(row.name)
    );

    if (!twinsScan?.id) {
      throw new Error(
        `TWINS EARLY ANTENATAL SCAN not found in scan_master. Found: ${scanRows
          .map(row => row.name)
          .join(", ")}`
      );
    }
    if (!tripletScan?.id) {
      throw new Error(
        `TRIPLET EARLY ANTENATAL SCAN not found in scan_master. Found: ${scanRows
          .map(row => row.name)
          .join(", ")}`
      );
    }

    const twinsFormat = await connection.query(
      `
      SELECT id, scanTemplate
      FROM scan_formats
      WHERE scanId = :scanId
      LIMIT 1
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { scanId: twinsScan.id }
      }
    );

    if (!twinsFormat?.[0]?.scanTemplate) {
      throw new Error("Twins scan template not found in scan_formats");
    }

    const updatedTripletTemplate = buildTripletTemplateFromTwins(
      twinsFormat[0].scanTemplate
    );

    const existingTripletFormat = await connection.query(
      `
      SELECT id, scanTemplate
      FROM scan_formats
      WHERE scanId = :scanId
      LIMIT 1
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { scanId: tripletScan.id }
      }
    );

    if (existingTripletFormat?.[0]?.scanTemplate) {
      await connection.query(
        `
        UPDATE scan_formats
        SET scanTemplate = :scanTemplate
        WHERE id = :id
        `,
        {
          type: Sequelize.QueryTypes.UPDATE,
          replacements: {
            id: existingTripletFormat[0].id,
            scanTemplate: updatedTripletTemplate
          }
        }
      );
      console.log(
        "Updated existing TRIPLET EARLY ANTENATAL SCAN template successfully."
      );
    } else {
      await connection.query(
        `
        INSERT INTO scan_formats (scanId, scanTemplate)
        VALUES (:scanId, :scanTemplate)
        `,
        {
          type: Sequelize.QueryTypes.INSERT,
          replacements: {
            scanId: tripletScan.id,
            scanTemplate: updatedTripletTemplate
          }
        }
      );
      console.log(
        "Inserted new TRIPLET EARLY ANTENATAL SCAN template successfully."
      );
    }
  } catch (error) {
    console.error(
      "Failed to update triplet antenatal template:",
      error.message
    );
    process.exitCode = 1;
  } finally {
    if (MySqlConnection._instance) {
      await MySqlConnection._instance.close();
    }
  }
}

if (require.main === module) {
  updateTripletEarlyAntenatalTemplate();
}

module.exports = {
  updateTripletEarlyAntenatalTemplate,
  buildTripletTemplateFromTwins
};
