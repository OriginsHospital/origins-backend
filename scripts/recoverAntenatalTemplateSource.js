require("dotenv").config();
const { Sequelize } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");

async function recoverAntenatalTemplateSource() {
  try {
    await MySqlConnection.createConnection();
    const c = MySqlConnection._instance;

    const candidates = await c.query(
      `
      SELECT
        sr.id,
        sr.scanId,
        sm.name AS scanName,
        sr.appointmentId,
        sr.type,
        sr.scanTestStatus,
        sr.scanResult
      FROM scan_results sr
      INNER JOIN scan_master sm ON sm.id = sr.scanId
      WHERE
        LOWER(sm.name) LIKE '%antenatal%'
      ORDER BY sr.id DESC
      LIMIT 500
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const useful = candidates.find(row => {
      const txt = String(row.scanResult || "");
      return /TWIN\s*A/i.test(txt) && /TWIN\s*B/i.test(txt);
    });

    if (!useful) {
      console.log("No historical scan result found with TWIN A/B sections.");
      return;
    }

    const plainSnippet = String(useful.scanResult)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 400);

    console.log(
      JSON.stringify(
        {
          id: useful.id,
          scanId: useful.scanId,
          scanName: useful.scanName,
          appointmentId: useful.appointmentId,
          type: useful.type,
          scanTestStatus: useful.scanTestStatus,
          plainSnippet
        },
        null,
        2
      )
    );
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
  recoverAntenatalTemplateSource();
}
