/**
 * Cleanup only TRIPLET / QUADRUPLETS antenatal scan content:
 * - remove COMMON FINDINGS / COMMON ENTRIES text
 * - normalize labels:
 *   TRIPLET: TRIPLET A/B/C
 *   QUADRUPLET: QUADRUPLET A/B/C/D
 *
 * Applies to both:
 * 1) scan_formats templates
 * 2) scan_results saved report HTML
 *
 * Usage:
 *   node scripts/cleanupTripletQuadAntenatalContent.js
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

function cleanupCommonEntries(html) {
  let out = String(html || "");
  out = out.replace(/COMMON\s*FINDINGS\s*:?\s*/gi, "");
  out = out.replace(/COMMON\s*ENTRIES\s*:?\s*/gi, "");

  // Remove full table rows that only carry common-entry headers.
  out = out.replace(
    /<tr[^>]*>[\s\S]*?(COMMON\s*FINDINGS|COMMON\s*ENTRIES)[\s\S]*?<\/tr>/gi,
    ""
  );

  // Compact accidental extra blank paragraphs.
  out = out.replace(/(<p[^>]*>\s*<\/p>\s*){2,}/gi, "<p></p>");
  return out;
}

function normalizeTripletLabels(html) {
  let out = String(html || "");
  out = out.replace(/\bTWIN\s*A\b/gi, "TRIPLET A");
  out = out.replace(/\bTWIN\s*B\b/gi, "TRIPLET B");
  out = out.replace(/\bTWIN\s*C\b/gi, "TRIPLET C");
  // keep already-correct labels as-is
  out = out.replace(/\bTRIPLET\s*A\b/gi, "TRIPLET A");
  out = out.replace(/\bTRIPLET\s*B\b/gi, "TRIPLET B");
  out = out.replace(/\bTRIPLET\s*C\b/gi, "TRIPLET C");
  return out;
}

function normalizeQuadLabels(html) {
  let out = String(html || "");
  out = out.replace(/\bTWIN\s*A\b/gi, "QUADRUPLET A");
  out = out.replace(/\bTWIN\s*B\b/gi, "QUADRUPLET B");
  out = out.replace(/\bTWIN\s*C\b/gi, "QUADRUPLET C");
  out = out.replace(/\bTWIN\s*D\b/gi, "QUADRUPLET D");
  out = out.replace(/\bQUADRUPLET\s*A\b/gi, "QUADRUPLET A");
  out = out.replace(/\bQUADRUPLET\s*B\b/gi, "QUADRUPLET B");
  out = out.replace(/\bQUADRUPLET\s*C\b/gi, "QUADRUPLET C");
  out = out.replace(/\bQUADRUPLET\s*D\b/gi, "QUADRUPLET D");
  return out;
}

function processTripletHtml(html) {
  return normalizeTripletLabels(cleanupCommonEntries(html));
}

function processQuadHtml(html) {
  return normalizeQuadLabels(cleanupCommonEntries(html));
}

async function updateTemplate(connection, scanId, processor) {
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
  if (!rows?.[0]?.id) return 0;

  const current = rows[0].scanTemplate || "";
  const updated = processor(current);
  if (updated === current) return 0;

  await connection.query(
    `
    UPDATE scan_formats
    SET scanTemplate = :scanTemplate
    WHERE id = :id
    `,
    {
      type: Sequelize.QueryTypes.UPDATE,
      replacements: { id: rows[0].id, scanTemplate: updated }
    }
  );
  return 1;
}

async function updateSavedResults(connection, scanId, processor) {
  const rows = await connection.query(
    `
    SELECT id, scanResult
    FROM scan_results
    WHERE scanId = :scanId
    `,
    {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { scanId }
    }
  );

  let changed = 0;
  for (const row of rows) {
    const current = row.scanResult || "";
    const updated = processor(current);
    if (updated === current) continue;

    await connection.query(
      `
      UPDATE scan_results
      SET scanResult = :scanResult
      WHERE id = :id
      `,
      {
        type: Sequelize.QueryTypes.UPDATE,
        replacements: { id: row.id, scanResult: updated }
      }
    );
    changed += 1;
  }
  return { total: rows.length, changed };
}

async function cleanupTripletQuadAntenatalContent() {
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

    const tripletScanIds = scanRows
      .filter(row => isTripletEarlyAntenatalScan(row.name))
      .map(row => row.id);
    const quadScanIds = scanRows
      .filter(row => isQuadrupletsEarlyAntenatalScan(row.name))
      .map(row => row.id);

    if (!tripletScanIds.length) {
      throw new Error("TRIPLET EARLY ANTENATAL SCAN not found");
    }
    if (!quadScanIds.length) {
      throw new Error("QUADRUPLETS EARLY ANTENATAL SCAN not found");
    }

    let templateUpdates = 0;
    let tripletSavedTotal = 0;
    let tripletSavedChanged = 0;
    let quadSavedTotal = 0;
    let quadSavedChanged = 0;

    for (const scanId of tripletScanIds) {
      templateUpdates += await updateTemplate(
        connection,
        scanId,
        processTripletHtml
      );
      const stats = await updateSavedResults(
        connection,
        scanId,
        processTripletHtml
      );
      tripletSavedTotal += stats.total;
      tripletSavedChanged += stats.changed;
    }

    for (const scanId of quadScanIds) {
      templateUpdates += await updateTemplate(
        connection,
        scanId,
        processQuadHtml
      );
      const stats = await updateSavedResults(
        connection,
        scanId,
        processQuadHtml
      );
      quadSavedTotal += stats.total;
      quadSavedChanged += stats.changed;
    }

    console.log(`Templates updated: ${templateUpdates}`);
    console.log(
      `Triplet saved reports checked=${tripletSavedTotal}, changed=${tripletSavedChanged}`
    );
    console.log(
      `Quadruplet saved reports checked=${quadSavedTotal}, changed=${quadSavedChanged}`
    );
  } catch (error) {
    console.error("Failed to cleanup triplet/quad content:", error.message);
    process.exitCode = 1;
  } finally {
    if (MySqlConnection._instance) {
      await MySqlConnection._instance.close();
    }
  }
}

if (require.main === module) {
  cleanupTripletQuadAntenatalContent();
}
