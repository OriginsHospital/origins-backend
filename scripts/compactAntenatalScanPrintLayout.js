/**
 * Compact antenatal scan templates so print/PDF fits on one page:
 * - drop forced A4 body height
 * - reduce letterhead left padding / @page left margin
 * - keep "Please correlate clinically / Consultant" with the impression
 *
 * Usage:
 *   node scripts/compactAntenatalScanPrintLayout.js
 */

require("dotenv").config();
const { Sequelize } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");
const { compactScanTemplateForPrint } = require("../utils/scanPrintUtils");

(async () => {
  await MySqlConnection.createConnection();
  const connection = MySqlConnection._instance;

  const scans = await connection.query(
    `
    SELECT sm.id, sm.name, sf.id AS formatId, sf.scanTemplate
    FROM scan_master sm
    JOIN scan_formats sf ON sf.scanId = sm.id
    WHERE LOWER(sm.name) LIKE '%antenatal%'
    `,
    { type: Sequelize.QueryTypes.SELECT }
  );

  for (const scan of scans) {
    const updated = compactScanTemplateForPrint(scan.scanTemplate);
    if (updated === scan.scanTemplate) {
      console.log(`No print-layout change for ${scan.name}`);
      continue;
    }

    await connection.query(
      `UPDATE scan_formats SET scanTemplate = :scanTemplate WHERE id = :id`,
      {
        replacements: { id: scan.formatId, scanTemplate: updated }
      }
    );
    console.log(
      `Updated print layout for ${scan.name} (formatId=${scan.formatId})`
    );
  }

  await connection.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
