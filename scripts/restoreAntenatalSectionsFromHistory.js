/**
 * Rebuild TRIPLET / QUADRUPLETS antenatal fetus sections from historical scan result.
 *
 * It preserves each template header/footer and only replaces the fetus section
 * (between "Number of foetuses :" and "IMPRESSION:").
 *
 * Usage:
 *   node scripts/restoreAntenatalSectionsFromHistory.js
 */

require("dotenv").config();
const { Sequelize } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");

const normalizeName = value =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

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

function replacePrefix(template, oldPrefix, letters, newPrefix) {
  let out = template;
  for (const letter of letters) {
    const rx = new RegExp(`\\b${oldPrefix}\\s*${letter}\\b`, "gi");
    out = out.replace(rx, `${newPrefix} ${letter}`);
  }
  return out;
}

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
  const nextSectionMatch = /(TWIN\s*[A-Z]|TRIPLET\s*[A-Z]|QUADRUPLET\s*[A-Z]|IMPRESSION|CONCLUSION|SUMMARY|COMMENTS|ADVICE|FINDINGS|REMARKS)\s*:?/i.exec(
    afterLabel.slice(sourceMatch[0].length)
  );
  const nextSectionIndex =
    nextSectionMatch && nextSectionMatch.index != null
      ? labelIndex + sourceMatch[0].length + nextSectionMatch.index
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

function extractFetusSection(html) {
  const startMatch = /Number of foetuses\s*:/i.exec(html);
  const endMatch = /IMPRESSION\s*:/i.exec(html);
  if (!startMatch || !endMatch || endMatch.index <= startMatch.index) {
    throw new Error("Could not isolate fetus section in historical report");
  }
  return html.slice(startMatch.index, endMatch.index);
}

function replaceFetusSection(targetTemplate, newSection) {
  const startMatch = /Number of foetuses\s*:/i.exec(targetTemplate);
  const endMatch = /IMPRESSION\s*:/i.exec(targetTemplate);

  if (startMatch && endMatch && endMatch.index > startMatch.index) {
    return (
      targetTemplate.slice(0, startMatch.index) +
      newSection +
      targetTemplate.slice(endMatch.index)
    );
  }

  // Fallback: inject before IMPRESSION when old section isn't present.
  if (endMatch) {
    return (
      targetTemplate.slice(0, endMatch.index) +
      newSection +
      targetTemplate.slice(endMatch.index)
    );
  }

  throw new Error("Could not place new fetus section into target template");
}

async function getTemplateByScanId(connection, scanId, label) {
  const rows = await connection.query(
    `SELECT id, scanTemplate FROM scan_formats WHERE scanId = :scanId LIMIT 1`,
    {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { scanId }
    }
  );
  if (!rows?.[0]?.scanTemplate) {
    throw new Error(`${label} template missing in scan_formats`);
  }
  return rows[0];
}

async function restoreAntenatalSectionsFromHistory() {
  try {
    await MySqlConnection.createConnection();
    const connection = MySqlConnection._instance;
    if (!connection) throw new Error("Failed to connect to database");

    const scanRows = await connection.query(
      `SELECT id, name FROM scan_master WHERE LOWER(name) LIKE '%antenatal%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const tripletScan = scanRows.find(row => isTripletScan(row.name));
    const quadrupletScan = scanRows.find(row => isQuadrupletScan(row.name));
    if (!tripletScan?.id) throw new Error("TRIPLET scan not found");
    if (!quadrupletScan?.id) throw new Error("QUADRUPLETS scan not found");

    // Find a historical scan_result that still has tabular TWIN labels.
    const sourceRows = await connection.query(
      `
      SELECT id, scanResult
      FROM scan_results
      WHERE
        scanId = :tripletScanId
        AND scanResult IS NOT NULL
      ORDER BY id DESC
      LIMIT 300
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { tripletScanId: tripletScan.id }
      }
    );

    const sourceRow = sourceRows.find(row => {
      const txt = String(row.scanResult || "");
      return /TWIN\s*A/i.test(txt) && /TWIN\s*B/i.test(txt);
    });
    if (!sourceRow?.scanResult) {
      throw new Error(
        "No historical TRIPLET scan result with TWIN A/B section found"
      );
    }

    const sourceFetusSection = extractFetusSection(sourceRow.scanResult);

    // Build TRIPLET section
    let tripletSection = sourceFetusSection;
    if (!/TWIN\s*C/i.test(tripletSection)) {
      tripletSection = duplicateSectionAsTable(
        tripletSection,
        "TWIN B",
        "TWIN C"
      );
    }
    tripletSection = replacePrefix(
      tripletSection,
      "TWIN",
      ["A", "B", "C"],
      "TRIPLET"
    );

    // Build QUADRUPLETS section
    let quadrupletSection = sourceFetusSection;
    if (!/TWIN\s*C/i.test(quadrupletSection)) {
      quadrupletSection = duplicateSectionAsTable(
        quadrupletSection,
        "TWIN B",
        "TWIN C"
      );
    }
    if (!/TWIN\s*D/i.test(quadrupletSection)) {
      quadrupletSection = duplicateSectionAsTable(
        quadrupletSection,
        "TWIN C",
        "TWIN D"
      );
    }
    quadrupletSection = replacePrefix(
      quadrupletSection,
      "TWIN",
      ["A", "B", "C", "D"],
      "QUADRUPLET"
    );

    const tripletTemplateRow = await getTemplateByScanId(
      connection,
      tripletScan.id,
      "TRIPLET"
    );
    const quadrupletTemplateRow = await getTemplateByScanId(
      connection,
      quadrupletScan.id,
      "QUADRUPLETS"
    );

    const tripletUpdatedTemplate = replaceFetusSection(
      tripletTemplateRow.scanTemplate,
      tripletSection
    );
    const quadrupletUpdatedTemplate = replaceFetusSection(
      quadrupletTemplateRow.scanTemplate,
      quadrupletSection
    );

    await connection.query(
      `UPDATE scan_formats SET scanTemplate = :scanTemplate WHERE id = :id`,
      {
        type: Sequelize.QueryTypes.UPDATE,
        replacements: {
          id: tripletTemplateRow.id,
          scanTemplate: tripletUpdatedTemplate
        }
      }
    );

    await connection.query(
      `UPDATE scan_formats SET scanTemplate = :scanTemplate WHERE id = :id`,
      {
        type: Sequelize.QueryTypes.UPDATE,
        replacements: {
          id: quadrupletTemplateRow.id,
          scanTemplate: quadrupletUpdatedTemplate
        }
      }
    );

    console.log(
      "Restored TRIPLET and QUADRUPLETS fetus tables with required labels."
    );
  } catch (error) {
    console.error("Failed to restore antenatal sections:", error.message);
    process.exitCode = 1;
  } finally {
    if (MySqlConnection._instance) {
      await MySqlConnection._instance.close();
    }
  }
}

if (require.main === module) {
  restoreAntenatalSectionsFromHistory();
}

module.exports = {
  restoreAntenatalSectionsFromHistory
};
