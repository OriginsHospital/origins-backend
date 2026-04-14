/**
 * Repair malformed saved scan reports for triplet/quadruplets antenatal scans.
 *
 * It only touches scan_results rows that are malformed (missing expected labels).
 * Those rows are reset to the latest template from scan_formats.
 *
 * Usage:
 *   node scripts/repairAntenatalSavedReports.js
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

function trCount(html) {
  return (String(html || "").match(/<tr/gi) || []).length;
}

function isMalformedTripletResult(html) {
  const s = String(html || "").toUpperCase();
  if (!s) return true;
  const hasA = s.includes("TRIPLET A");
  const hasB = s.includes("TRIPLET B");
  const hasC = s.includes("TRIPLET C");
  return !(hasA && hasB && hasC) || trCount(html) < 20;
}

function isMalformedQuadrupletResult(html) {
  const s = String(html || "").toUpperCase();
  if (!s) return true;
  const hasA = s.includes("QUADRUPLET A");
  const hasB = s.includes("QUADRUPLET B");
  const hasC = s.includes("QUADRUPLET C");
  const hasD = s.includes("QUADRUPLET D");
  return !(hasA && hasB && hasC && hasD) || trCount(html) < 28;
}

async function getTemplateByScanId(connection, scanId) {
  const rows = await connection.query(
    `
    SELECT scanTemplate
    FROM scan_formats
    WHERE scanId = :scanId
    LIMIT 1
    `,
    {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { scanId }
    }
  );
  return rows?.[0]?.scanTemplate || null;
}

async function repairForScanId(connection, scanId, isMalformedFn) {
  const template = await getTemplateByScanId(connection, scanId);
  if (!template) {
    throw new Error(`Template missing for scanId=${scanId}`);
  }

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

  let fixed = 0;
  for (const row of rows) {
    if (!isMalformedFn(row.scanResult)) {
      continue;
    }

    await connection.query(
      `
      UPDATE scan_results
      SET scanResult = :scanResult
      WHERE id = :id
      `,
      {
        type: Sequelize.QueryTypes.UPDATE,
        replacements: {
          id: row.id,
          scanResult: template
        }
      }
    );
    fixed += 1;
  }

  return { total: rows.length, fixed };
}

async function repairAntenatalSavedReports() {
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

    const tripletScan = scanRows.find(row =>
      isTripletEarlyAntenatalScan(row.name)
    );
    const quadrupletsScan = scanRows.find(row =>
      isQuadrupletsEarlyAntenatalScan(row.name)
    );

    if (!tripletScan?.id) {
      throw new Error("TRIPLET EARLY ANTENATAL SCAN not found");
    }
    if (!quadrupletsScan?.id) {
      throw new Error("QUADRUPLETS EARLY ANTENATAL SCAN not found");
    }

    const tripletStats = await repairForScanId(
      connection,
      tripletScan.id,
      isMalformedTripletResult
    );
    const quadrupletStats = await repairForScanId(
      connection,
      quadrupletsScan.id,
      isMalformedQuadrupletResult
    );

    console.log(
      `Triplet reports checked=${tripletStats.total}, repaired=${tripletStats.fixed}`
    );
    console.log(
      `Quadruplet reports checked=${quadrupletStats.total}, repaired=${quadrupletStats.fixed}`
    );
  } catch (error) {
    console.error("Failed to repair saved antenatal reports:", error.message);
    process.exitCode = 1;
  } finally {
    if (MySqlConnection._instance) {
      await MySqlConnection._instance.close();
    }
  }
}

if (require.main === module) {
  repairAntenatalSavedReports();
}
