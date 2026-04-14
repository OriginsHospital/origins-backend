/**
 * Remove COMMON FINDINGS / COMMON ENTRIES from TWINS EARLY ANTENATAL SCAN
 * template and saved reports.
 *
 * Usage:
 *   node scripts/cleanupTwinsAntenatalCommonEntries.js
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

function cleanupCommonEntries(html) {
  let out = String(html || "");
  out = out.replace(/COMMON\s*FINDINGS\s*:?\s*/gi, "");
  out = out.replace(/COMMON\s*ENTRIES\s*:?\s*/gi, "");
  out = out.replace(
    /<tr[^>]*>[\s\S]*?(COMMON\s*FINDINGS|COMMON\s*ENTRIES)[\s\S]*?<\/tr>/gi,
    ""
  );
  return out;
}

async function cleanupTwinsAntenatalCommonEntries() {
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
    const twinScanIds = scanRows
      .filter(row => isTwinsEarlyAntenatalScan(row.name))
      .map(row => row.id);

    if (!twinScanIds.length) {
      throw new Error("TWINS EARLY ANTENATAL SCAN not found");
    }

    let templateChanged = 0;
    let reportTotal = 0;
    let reportChanged = 0;

    for (const scanId of twinScanIds) {
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
      if (formatRows?.[0]?.id) {
        const current = formatRows[0].scanTemplate || "";
        const updated = cleanupCommonEntries(current);
        if (updated !== current) {
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
                scanTemplate: updated
              }
            }
          );
          templateChanged += 1;
        }
      }

      const resultRows = await connection.query(
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
      reportTotal += resultRows.length;
      for (const row of resultRows) {
        const current = row.scanResult || "";
        const updated = cleanupCommonEntries(current);
        if (updated === current) continue;
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
              scanResult: updated
            }
          }
        );
        reportChanged += 1;
      }
    }

    console.log(`Twins templates changed: ${templateChanged}`);
    console.log(
      `Twins saved reports checked=${reportTotal}, changed=${reportChanged}`
    );
  } catch (error) {
    console.error("Failed to cleanup twins common entries:", error.message);
    process.exitCode = 1;
  } finally {
    if (MySqlConnection._instance) {
      await MySqlConnection._instance.close();
    }
  }
}

if (require.main === module) {
  cleanupTwinsAntenatalCommonEntries();
}
