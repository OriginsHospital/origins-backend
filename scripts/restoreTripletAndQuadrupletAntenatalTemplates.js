/**
 * Restore TRIPLET and QUADRUPLETS antenatal scan templates from TWINS template.
 *
 * Final output:
 * - TRIPLET: TRIPLET A / TRIPLET B / TRIPLET C (all in table format)
 * - QUADRUPLETS: QUADRUPLET A / B / C / D (all in table format)
 *
 * Usage:
 *   node scripts/restoreTripletAndQuadrupletAntenatalTemplates.js
 */

require("dotenv").config();
const { Sequelize } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");

const normalizeName = value =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const isTwinsScan = name => {
  const n = normalizeName(name);
  return (
    n.includes("twin") &&
    n.includes("early") &&
    n.includes("antenatal") &&
    n.includes("scan")
  );
};

const isTripletScan = name => {
  const n = normalizeName(name);
  return (
    (n.includes("triplet") || n.includes("triple")) &&
    n.includes("early") &&
    n.includes("antenatal") &&
    n.includes("scan")
  );
};

const isQuadrupletScan = name => {
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

function duplicateSectionAsTable(template, sourceLabel, targetLabel) {
  const sourceRegex = new RegExp(sourceLabel.replace(/\s+/g, "\\s*"), "i");
  const sourceMatch = sourceRegex.exec(template);
  if (!sourceMatch || sourceMatch.index == null) {
    throw new Error(`Could not find '${sourceLabel}'`);
  }

  const labelIndex = sourceMatch.index;
  const blockStart = template.lastIndexOf("<tr", labelIndex);
  if (blockStart === -1) {
    throw new Error(`Could not find row start for '${sourceLabel}'`);
  }

  const afterLabel = template.slice(labelIndex);
  const nextSectionMatch = /(IMPRESSION|CONCLUSION|SUMMARY|COMMENTS|ADVICE|FINDINGS|REMARKS)\s*:?/i.exec(
    afterLabel
  );
  const nextSectionIndex =
    nextSectionMatch && nextSectionMatch.index != null
      ? labelIndex + nextSectionMatch.index
      : template.length;

  const blockEndTr = template.lastIndexOf("</tr>", nextSectionIndex);
  if (blockEndTr === -1) {
    throw new Error(`Could not find row end for '${sourceLabel}'`);
  }
  const blockEnd = blockEndTr + "</tr>".length;

  const sourceBlock = template.slice(blockStart, blockEnd);
  const sourceLabelRegex = new RegExp(
    sourceLabel.replace(/\s+/g, "\\s*"),
    "gi"
  );
  const targetBlock = sourceBlock.replace(sourceLabelRegex, targetLabel);

  return template.slice(0, blockEnd) + targetBlock + template.slice(blockEnd);
}

function replacePrefix(template, oldPrefix, letters, newPrefix) {
  let out = template;
  for (const letter of letters) {
    const rx = new RegExp(`\\b${oldPrefix}\\s*${letter}\\b`, "gi");
    out = out.replace(rx, `${newPrefix} ${letter}`);
  }
  return out;
}

async function getScanTemplate(connection, scanId, label) {
  const rows = await connection.query(
    `SELECT id, scanTemplate FROM scan_formats WHERE scanId = :scanId LIMIT 1`,
    {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { scanId }
    }
  );
  if (!rows?.[0]?.scanTemplate) {
    throw new Error(`${label} template not found in scan_formats`);
  }
  return rows[0].scanTemplate;
}

async function upsertScanTemplate(connection, scanId, scanTemplate) {
  const rows = await connection.query(
    `SELECT id FROM scan_formats WHERE scanId = :scanId LIMIT 1`,
    {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { scanId }
    }
  );
  if (rows?.[0]?.id) {
    await connection.query(
      `UPDATE scan_formats SET scanTemplate = :scanTemplate WHERE id = :id`,
      {
        type: Sequelize.QueryTypes.UPDATE,
        replacements: {
          id: rows[0].id,
          scanTemplate
        }
      }
    );
  } else {
    await connection.query(
      `INSERT INTO scan_formats (scanId, scanTemplate) VALUES (:scanId, :scanTemplate)`,
      {
        type: Sequelize.QueryTypes.INSERT,
        replacements: {
          scanId,
          scanTemplate
        }
      }
    );
  }
}

async function restoreTripletAndQuadrupletAntenatalTemplates() {
  try {
    await MySqlConnection.createConnection();
    const connection = MySqlConnection._instance;
    if (!connection) throw new Error("Failed to connect to database");

    const scanRows = await connection.query(
      `SELECT id, name FROM scan_master WHERE LOWER(name) LIKE '%antenatal%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const twinsScan = scanRows.find(row => isTwinsScan(row.name));
    const tripletScan = scanRows.find(row => isTripletScan(row.name));
    const quadrupletScan = scanRows.find(row => isQuadrupletScan(row.name));

    if (!twinsScan?.id) throw new Error("TWINS scan not found");
    if (!tripletScan?.id) throw new Error("TRIPLET scan not found");
    if (!quadrupletScan?.id) throw new Error("QUADRUPLETS scan not found");

    const twinsTemplate = await getScanTemplate(
      connection,
      twinsScan.id,
      "TWINS EARLY ANTENATAL SCAN"
    );

    // Build clean TRIPLET from TWINS
    const twinsPlusTwinC = duplicateSectionAsTable(
      twinsTemplate,
      "TWIN B",
      "TWIN C"
    );
    const tripletTemplate = replacePrefix(
      twinsPlusTwinC,
      "TWIN",
      ["A", "B", "C"],
      "TRIPLET"
    );

    // Build clean QUADRUPLETS from TWINS
    const twinsPlusTwinCForQuad = duplicateSectionAsTable(
      twinsTemplate,
      "TWIN B",
      "TWIN C"
    );
    const twinsPlusTwinD = duplicateSectionAsTable(
      twinsPlusTwinCForQuad,
      "TWIN C",
      "TWIN D"
    );
    const quadrupletTemplate = replacePrefix(
      twinsPlusTwinD,
      "TWIN",
      ["A", "B", "C", "D"],
      "QUADRUPLET"
    );

    await upsertScanTemplate(connection, tripletScan.id, tripletTemplate);
    await upsertScanTemplate(connection, quadrupletScan.id, quadrupletTemplate);

    console.log(
      "Restored TRIPLET and QUADRUPLETS antenatal templates successfully."
    );
  } catch (error) {
    console.error("Failed to restore templates:", error.message);
    process.exitCode = 1;
  } finally {
    if (MySqlConnection._instance) {
      await MySqlConnection._instance.close();
    }
  }
}

if (require.main === module) {
  restoreTripletAndQuadrupletAntenatalTemplates();
}

module.exports = {
  restoreTripletAndQuadrupletAntenatalTemplates,
  duplicateSectionAsTable,
  replacePrefix
};
