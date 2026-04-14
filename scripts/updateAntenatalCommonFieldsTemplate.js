/**
 * Make Cervix/Internal OS/EDD common fields in early antenatal scan templates.
 *
 * Applies only to:
 * - TWINS EARLY ANTENATAL SCAN
 * - TRIPLET EARLY ANTENATAL SCAN
 * - QUADRUPLETS EARLY ANTENATAL SCAN
 *
 * It removes Cervix/Internal OS/EDD rows from baby-wise sections
 * and inserts one common table just above "IMPRESSION:".
 *
 * Usage:
 *   node scripts/updateAntenatalCommonFieldsTemplate.js
 */

require("dotenv").config();
const { Sequelize } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");

const COMMON_BLOCK_START = "<!--COMMON_ANTENATAL_FIELDS_START-->";
const COMMON_BLOCK_END = "<!--COMMON_ANTENATAL_FIELDS_END-->";

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

const stripHtml = html =>
  String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

function isLabelRow(rowHtml, label) {
  const txt = stripHtml(rowHtml);
  return txt.includes(label.toLowerCase());
}

function buildFallbackRow(label) {
  return `<tr><td>${label} :</td><td></td></tr>`;
}

function removeExistingCommonBlock(template) {
  const blockRegex = new RegExp(
    `${COMMON_BLOCK_START}[\\s\\S]*?${COMMON_BLOCK_END}`,
    "gi"
  );
  return template.replace(blockRegex, "");
}

function transformTemplate(template) {
  if (!template || typeof template !== "string") {
    throw new Error("Invalid template");
  }

  let work = removeExistingCommonBlock(template);
  const rowMatches = [...work.matchAll(/<tr[\s\S]*?<\/tr>/gi)];

  let cervixRow = null;
  let internalOsRow = null;
  let eddRow = null;

  // Capture first row style for each field.
  for (const m of rowMatches) {
    const row = m[0];
    if (!cervixRow && isLabelRow(row, "cervix")) cervixRow = row;
    if (!internalOsRow && isLabelRow(row, "internal os")) internalOsRow = row;
    if (!eddRow && isLabelRow(row, "edd")) eddRow = row;
  }

  const resolvedCervixRow = cervixRow || buildFallbackRow("Cervix");
  const resolvedInternalOsRow =
    internalOsRow || buildFallbackRow("Internal OS");
  const resolvedEddRow = eddRow || buildFallbackRow("EDD");

  // Remove all repeated baby-wise rows for these three labels.
  work = work.replace(/<tr[\s\S]*?<\/tr>/gi, row => {
    if (
      isLabelRow(row, "cervix") ||
      isLabelRow(row, "internal os") ||
      isLabelRow(row, "edd")
    ) {
      return "";
    }
    return row;
  });

  const commonTable = `
${COMMON_BLOCK_START}
<p><strong>COMMON ENTRIES :</strong></p>
<table style="width:100%; border-collapse:collapse; margin-bottom:8px;">
  <tbody>
    ${resolvedCervixRow}
    ${resolvedInternalOsRow}
    ${resolvedEddRow}
  </tbody>
</table>
${COMMON_BLOCK_END}
`;

  const impressionMatch = /IMPRESSION\s*:/i.exec(work);
  if (impressionMatch && impressionMatch.index != null) {
    const idx = impressionMatch.index;
    work = work.slice(0, idx) + commonTable + work.slice(idx);
  } else {
    work = work + commonTable;
  }

  return work;
}

async function updateTemplateByScanId(connection, scanId, label) {
  const formatRows = await connection.query(
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

  if (!formatRows?.[0]?.scanTemplate) {
    throw new Error(`Template not found for ${label}`);
  }

  const updatedTemplate = transformTemplate(formatRows[0].scanTemplate);

  await connection.query(
    `
    UPDATE scan_formats
    SET scanTemplate = :scanTemplate
    WHERE id = :id
    `,
    {
      type: Sequelize.QueryTypes.UPDATE,
      replacements: {
        id: formatRows[0].id,
        scanTemplate: updatedTemplate
      }
    }
  );
}

async function updateAntenatalCommonFieldsTemplate() {
  try {
    await MySqlConnection.createConnection();
    const connection = MySqlConnection._instance;

    if (!connection) throw new Error("Failed to connect to database");

    const scans = await connection.query(
      `
      SELECT id, name
      FROM scan_master
      WHERE LOWER(name) LIKE '%antenatal%'
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const twinsScan = scans.find(row => isTwinsEarlyAntenatalScan(row.name));
    const tripletScan = scans.find(row =>
      isTripletEarlyAntenatalScan(row.name)
    );
    const quadrupletsScan = scans.find(row =>
      isQuadrupletsEarlyAntenatalScan(row.name)
    );

    if (!twinsScan?.id) {
      throw new Error("TWINS EARLY ANTENATAL SCAN not found in scan_master");
    }
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
      twinsScan.id,
      "TWINS EARLY ANTENATAL SCAN"
    );
    console.log("Updated common fields for TWINS EARLY ANTENATAL SCAN.");

    await updateTemplateByScanId(
      connection,
      tripletScan.id,
      "TRIPLET EARLY ANTENATAL SCAN"
    );
    console.log("Updated common fields for TRIPLET EARLY ANTENATAL SCAN.");

    await updateTemplateByScanId(
      connection,
      quadrupletsScan.id,
      "QUADRUPLETS EARLY ANTENATAL SCAN"
    );
    console.log("Updated common fields for QUADRUPLETS EARLY ANTENATAL SCAN.");
  } catch (error) {
    console.error(
      "Failed to update common antenatal fields templates:",
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
  updateAntenatalCommonFieldsTemplate();
}

module.exports = {
  updateAntenatalCommonFieldsTemplate,
  transformTemplate
};
