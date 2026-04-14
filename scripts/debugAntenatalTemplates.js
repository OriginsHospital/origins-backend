require("dotenv").config();
const { Sequelize } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");

async function debugAntenatalTemplates() {
  try {
    await MySqlConnection.createConnection();
    const connection = MySqlConnection._instance;

    const scans = await connection.query(
      `
      SELECT id, name
      FROM scan_master
      WHERE LOWER(name) LIKE '%antenatal%'
      ORDER BY id
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const scan of scans) {
      const formatRows = await connection.query(
        `
        SELECT id, scanTemplate
        FROM scan_formats
        WHERE scanId = :scanId
        LIMIT 1
        `,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { scanId: scan.id }
        }
      );
      const template = formatRows?.[0]?.scanTemplate || "";
      console.log("--------------------------------------------------");
      console.log(`Scan: ${scan.name} (id=${scan.id})`);
      console.log(`Format row: ${formatRows?.[0]?.id || "none"}`);
      const labels = template.match(
        /(TWIN\s*[ABCD]|TRIPLET\s*[ABCD]|QUADRUPLET\s*[ABCD])/gi
      );
      console.log(`Labels found: ${labels ? labels.join(", ") : "none"}`);
      console.log(`TR count: ${(template.match(/<tr/gi) || []).length}`);
      console.log("Template start preview:");
      console.log(template.slice(0, 500));

      if (labels && labels.length > 0) {
        const uniqueLabels = [...new Set(labels.map(l => l.toUpperCase()))];
        for (const label of uniqueLabels) {
          const idx = template.toUpperCase().indexOf(label);
          if (idx !== -1) {
            const start = Math.max(0, idx - 160);
            const end = Math.min(template.length, idx + 260);
            console.log(`Snippet around ${label}:`);
            console.log(template.slice(start, end));
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    if (MySqlConnection._instance) {
      await MySqlConnection._instance.close();
    }
  }
}

if (require.main === module) {
  debugAntenatalTemplates();
}
