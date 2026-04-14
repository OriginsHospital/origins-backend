require("dotenv").config();
const { Sequelize } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");

async function debugAntenatalScanTemplates() {
  try {
    await MySqlConnection.createConnection();
    const c = MySqlConnection._instance;
    const scans = await c.query(
      `
      SELECT sm.id, sm.name, sf.id AS formatId, sf.scanTemplate
      FROM scan_master sm
      LEFT JOIN scan_formats sf ON sf.scanId = sm.id
      WHERE LOWER(sm.name) LIKE '%antenatal%'
      ORDER BY sm.id
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const row of scans) {
      const template = row.scanTemplate || "";
      const hasTwinA = /TWIN\s*A/i.test(template);
      const hasTwinB = /TWIN\s*B/i.test(template);
      const hasTripletA = /TRIPLET\s*A/i.test(template);
      const hasQuadA = /QUADRUPLET\s*A/i.test(template);
      const plainSnippet = String(template)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 260);
      console.log(
        JSON.stringify(
          {
            id: row.id,
            name: row.name,
            formatId: row.formatId || null,
            hasTwinA,
            hasTwinB,
            hasTripletA,
            hasQuadA,
            plainSnippet
          },
          null,
          2
        )
      );
    }
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    if (MySqlConnection._instance) {
      await MySqlConnection._instance.close();
    }
  }
}

if (require.main === module) {
  debugAntenatalScanTemplates();
}
