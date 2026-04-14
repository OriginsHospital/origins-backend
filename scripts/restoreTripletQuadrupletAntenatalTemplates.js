/**
 * Restore and standardize antenatal templates for:
 * - TRIPLET EARLY ANTENATAL SCAN
 * - QUADRUPLETS EARLY ANTENATAL SCAN
 *
 * Source of truth: TWINS EARLY ANTENATAL SCAN template.
 *
 * This script keeps rows in tabular format and applies headings:
 * - Triplet: TRIPLET A/B/C
 * - Quadruplet: QUADRUPLET A/B/C/D
 *
 * Usage:
 *   node scripts/restoreTripletQuadrupletAntenatalTemplates.js
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

function sectionRegex(label) {
  return new RegExp(
    label
      .split(/\s+/)
      .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s*"),
    "i"
  );
}

function replaceLabel(template, fromLabel, toLabel) {
  const re = new RegExp(
    fromLabel
      .split(/\s+/)
      .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s*"),
    "gi"
  );
  return template.replace(re, toLabel);
}

function normalizeToTwinLabels(template) {
  // Normalize any previously renamed variants back to TWIN X
  // so section duplication logic always works.
  return template
    .replace(/\bTRIPLET\s*([ABCD])\b/gi, "TWIN $1")
    .replace(/\bQUADRUPLET\s*([ABCD])\b/gi, "TWIN $1");
}

function getSectionBlock(template, label) {
  const match = sectionRegex(label).exec(template);
  if (!match || match.index == null) {
    throw new Error(`Section '${label}' not found`);
  }

  const labelIndex = match.index;
  const blockStart = template.lastIndexOf("<tr", labelIndex);
  if (blockStart === -1) {
    throw new Error(`Could not find table row start for '${label}'`);
  }

  const afterLabel = template.slice(labelIndex);
  const markerRegex = /(TWIN\s*[A-D]|TRIPLET\s*[A-D]|QUADRUPLET\s*[A-D]|IMPRESSION|CONCLUSION|SUMMARY|COMMENTS|ADVICE|FINDINGS|REMARKS)\s*:?/gi;

  let nextSectionIndex = template.length;
  let marker;
  while ((marker = markerRegex.exec(afterLabel)) !== null) {
    if (marker.index > 0) {
      nextSectionIndex = labelIndex + marker.index;
      break;
    }
  }

  const lastTrEndBeforeSection = template.lastIndexOf(
    "</tr>",
    nextSectionIndex
  );
  if (lastTrEndBeforeSection === -1) {
    throw new Error(`Could not find table row end for '${label}' block`);
  }
  const blockEnd = lastTrEndBeforeSection + "</tr>".length;
  return { blockStart, blockEnd };
}

function duplicateSection(template, sourceLabel, targetLabel) {
  if (sectionRegex(targetLabel).test(template)) {
    return template;
  }

  const { blockStart, blockEnd } = getSectionBlock(template, sourceLabel);
  const sourceBlock = template.slice(blockStart, blockEnd);
  const targetBlock = replaceLabel(sourceBlock, sourceLabel, targetLabel);

  if (targetBlock === sourceBlock) {
    throw new Error(
      `Failed to create '${targetLabel}' block from '${sourceLabel}'`
    );
  }

  return template.slice(0, blockEnd) + targetBlock + template.slice(blockEnd);
}

function buildTripletTemplateFromTwins(twinsTemplate) {
  let template = normalizeToTwinLabels(twinsTemplate);
  template = duplicateSection(template, "TWIN B", "TWIN C");
  template = replaceLabel(template, "TWIN A", "TRIPLET A");
  template = replaceLabel(template, "TWIN B", "TRIPLET B");
  template = replaceLabel(template, "TWIN C", "TRIPLET C");
  return template;
}

function buildQuadrupletTemplateFromTwins(twinsTemplate) {
  let template = normalizeToTwinLabels(twinsTemplate);
  template = duplicateSection(template, "TWIN B", "TWIN C");
  template = duplicateSection(template, "TWIN C", "TWIN D");
  template = replaceLabel(template, "TWIN A", "QUADRUPLET A");
  template = replaceLabel(template, "TWIN B", "QUADRUPLET B");
  template = replaceLabel(template, "TWIN C", "QUADRUPLET C");
  template = replaceLabel(template, "TWIN D", "QUADRUPLET D");
  return template;
}

async function upsertScanTemplate(connection, scanId, scanTemplate) {
  const existing = await connection.query(
    `
    SELECT id
    FROM scan_formats
    WHERE scanId = :scanId
    LIMIT 1
    `,
    {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { scanId }
    }
  );

  if (existing?.[0]?.id) {
    await connection.query(
      `
      UPDATE scan_formats
      SET scanTemplate = :scanTemplate
      WHERE id = :id
      `,
      {
        type: Sequelize.QueryTypes.UPDATE,
        replacements: { id: existing[0].id, scanTemplate }
      }
    );
    return "updated";
  }

  await connection.query(
    `
    INSERT INTO scan_formats (scanId, scanTemplate)
    VALUES (:scanId, :scanTemplate)
    `,
    {
      type: Sequelize.QueryTypes.INSERT,
      replacements: { scanId, scanTemplate }
    }
  );
  return "inserted";
}

async function restoreTripletQuadrupletAntenatalTemplates() {
  try {
    await MySqlConnection.createConnection();
    const connection = MySqlConnection._instance;
    if (!connection) throw new Error("Failed to connect to database");

    const scanRows = await connection.query(
      `
      SELECT id, name
      FROM scan_master
      WHERE LOWER(name) LIKE '%antenatal%'
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const twinsScan = scanRows.find(row => isTwinsEarlyAntenatalScan(row.name));
    const tripletScan = scanRows.find(row =>
      isTripletEarlyAntenatalScan(row.name)
    );
    const quadrupletsScan = scanRows.find(row =>
      isQuadrupletsEarlyAntenatalScan(row.name)
    );

    if (!twinsScan?.id) {
      throw new Error("TWINS EARLY ANTENATAL SCAN not found");
    }
    if (!tripletScan?.id) {
      throw new Error("TRIPLET EARLY ANTENATAL SCAN not found");
    }
    if (!quadrupletsScan?.id) {
      throw new Error("QUADRUPLETS EARLY ANTENATAL SCAN not found");
    }

    const twinsTemplateRows = await connection.query(
      `
      SELECT scanTemplate
      FROM scan_formats
      WHERE scanId = :scanId
      LIMIT 1
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { scanId: twinsScan.id }
      }
    );

    const twinsTemplate = twinsTemplateRows?.[0]?.scanTemplate;
    if (!twinsTemplate) {
      throw new Error("TWINS template not found in scan_formats");
    }

    const tripletTemplate = buildTripletTemplateFromTwins(twinsTemplate);
    const quadrupletTemplate = buildQuadrupletTemplateFromTwins(twinsTemplate);

    const tripletStatus = await upsertScanTemplate(
      connection,
      tripletScan.id,
      tripletTemplate
    );
    const quadrupletStatus = await upsertScanTemplate(
      connection,
      quadrupletsScan.id,
      quadrupletTemplate
    );

    console.log(
      `TRIPLET EARLY ANTENATAL SCAN template ${tripletStatus} successfully.`
    );
    console.log(
      `QUADRUPLETS EARLY ANTENATAL SCAN template ${quadrupletStatus} successfully.`
    );
  } catch (error) {
    console.error("Failed to restore antenatal templates:", error.message);
    process.exitCode = 1;
  } finally {
    if (MySqlConnection._instance) {
      await MySqlConnection._instance.close();
    }
  }
}

if (require.main === module) {
  restoreTripletQuadrupletAntenatalTemplates();
}

module.exports = {
  restoreTripletQuadrupletAntenatalTemplates,
  buildTripletTemplateFromTwins,
  buildQuadrupletTemplateFromTwins
};
