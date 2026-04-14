/**
 * Update QUADRUPLETS EARLY ANTENATAL SCAN template.
 *
 * It clones the current TRIPLET EARLY ANTENATAL SCAN template
 * and appends a "TWIN D" block by copying the "TWIN C" table rows.
 *
 * Usage:
 *   node scripts/updateQuadrupletsEarlyAntenatalTemplate.js
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

function duplicateTwinSectionAsTable(template, sourceLabel, targetLabel) {
  if (!template || typeof template !== "string") {
    throw new Error("Invalid source template");
  }

  const targetRegex = new RegExp(targetLabel.replace(/\s+/g, "\\s*"), "i");
  if (targetRegex.test(template)) {
    return template;
  }

  const sourceRegex = new RegExp(sourceLabel.replace(/\s+/g, "\\s*"), "i");
  const sourceMatch = sourceRegex.exec(template);
  if (!sourceMatch || sourceMatch.index == null) {
    throw new Error(
      `Could not find '${sourceLabel}' section in source template`
    );
  }

  // Duplicate full table rows of source section to keep target section tabular.
  const labelIndex = sourceMatch.index;
  const blockStart = template.lastIndexOf("<tr", labelIndex);
  if (blockStart === -1) {
    throw new Error(`Could not find table row start for '${sourceLabel}'`);
  }

  const afterLabel = template.slice(labelIndex);
  const nextSectionMatch = /(IMPRESSION|CONCLUSION|SUMMARY|COMMENTS|ADVICE|FINDINGS|REMARKS)\s*:?/i.exec(
    afterLabel
  );
  const nextSectionIndex =
    nextSectionMatch && nextSectionMatch.index != null
      ? labelIndex + nextSectionMatch.index
      : template.length;

  const lastTrEndBeforeSection = template.lastIndexOf(
    "</tr>",
    nextSectionIndex
  );
  if (lastTrEndBeforeSection === -1) {
    throw new Error(`Could not find table row end for '${sourceLabel}' block`);
  }
  const blockEnd = lastTrEndBeforeSection + "</tr>".length;

  const sourceBlock = template.slice(blockStart, blockEnd);
  const sourceBlockLabelRegex = new RegExp(
    sourceLabel.replace(/\s+/g, "\\s*"),
    "gi"
  );
  const targetBlock = sourceBlock.replace(sourceBlockLabelRegex, targetLabel);

  if (targetBlock === sourceBlock) {
    throw new Error(`Failed to construct '${targetLabel}' block`);
  }

  return template.slice(0, blockEnd) + targetBlock + template.slice(blockEnd);
}

async function updateQuadrupletsEarlyAntenatalTemplate() {
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
      throw new Error(
        `TRIPLET EARLY ANTENATAL SCAN not found in scan_master. Found: ${scanRows
          .map(row => row.name)
          .join(", ")}`
      );
    }
    if (!quadrupletsScan?.id) {
      throw new Error(
        `QUADRUPLETS EARLY ANTENATAL SCAN not found in scan_master. Found: ${scanRows
          .map(row => row.name)
          .join(", ")}`
      );
    }

    const tripletFormat = await connection.query(
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

    if (!tripletFormat?.[0]?.scanTemplate) {
      throw new Error("Triplet scan template not found in scan_formats");
    }

    const updatedQuadrupletsTemplate = duplicateTwinSectionAsTable(
      tripletFormat[0].scanTemplate,
      "TWIN C",
      "TWIN D"
    );

    const existingQuadrupletsFormat = await connection.query(
      `
      SELECT id, scanTemplate
      FROM scan_formats
      WHERE scanId = :scanId
      LIMIT 1
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { scanId: quadrupletsScan.id }
      }
    );

    if (existingQuadrupletsFormat?.[0]?.scanTemplate) {
      await connection.query(
        `
        UPDATE scan_formats
        SET scanTemplate = :scanTemplate
        WHERE id = :id
        `,
        {
          type: Sequelize.QueryTypes.UPDATE,
          replacements: {
            id: existingQuadrupletsFormat[0].id,
            scanTemplate: updatedQuadrupletsTemplate
          }
        }
      );
      console.log(
        "Updated existing QUADRUPLETS EARLY ANTENATAL SCAN template successfully."
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
            scanId: quadrupletsScan.id,
            scanTemplate: updatedQuadrupletsTemplate
          }
        }
      );
      console.log(
        "Inserted new QUADRUPLETS EARLY ANTENATAL SCAN template successfully."
      );
    }
  } catch (error) {
    console.error(
      "Failed to update quadruplets antenatal template:",
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
  updateQuadrupletsEarlyAntenatalTemplate();
}

module.exports = {
  updateQuadrupletsEarlyAntenatalTemplate,
  duplicateTwinSectionAsTable
};
