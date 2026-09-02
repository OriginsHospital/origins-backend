const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function runMigration() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_PASSWORD,
      database:
        process.env.ENVIRONMENT === "development"
          ? process.env.MYSQL_DBNAME
          : process.env.MYSQL_DBNAME_PROD || process.env.MYSQL_DBNAME,
      multipleStatements: true
    });

    console.log("Connected to database successfully");

    const migrationPath = path.join(
      __dirname,
      "058_create_treatment_fet_cycles.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("Creating treatment_fet_cycles and adding cycleNumber...");
    await connection.query(migrationSQL);

    const [duplicateSheets] = await connection.query(`
      SELECT treatmentCycleId, COUNT(*) AS sheetCount
      FROM treatment_fetsheet_associations
      GROUP BY treatmentCycleId
      HAVING COUNT(*) > 1
    `);

    for (const row of duplicateSheets) {
      const [sheets] = await connection.query(
        `SELECT id FROM treatment_fetsheet_associations
         WHERE treatmentCycleId = ?
         ORDER BY id ASC`,
        [row.treatmentCycleId]
      );
      for (let i = 0; i < sheets.length; i += 1) {
        await connection.query(
          `UPDATE treatment_fetsheet_associations
           SET cycleNumber = ?
           WHERE id = ?`,
          [i + 1, sheets[i].id]
        );
      }
    }

    await connection.query(`
      INSERT IGNORE INTO treatment_fet_cycles (
        visitId,
        treatmentCycleId,
        cycleNumber,
        fetStartDate,
        fetStartedBy,
        fetEndedDate,
        fetEndedReason,
        fetEndedBy
      )
      SELECT
        vtca.visitId,
        vtca.id,
        1,
        COALESCE(tt.fetStartDate, vpa.fetDate),
        tt.fetStartedBy,
        tt.fetEndedDate,
        tt.fetEndedReason,
        tt.fetEndedBy
      FROM visit_treatment_cycles_associations vtca
      LEFT JOIN visit_packages_associations vpa ON vpa.visitId = vtca.visitId
      LEFT JOIN treatment_timestamps tt
        ON tt.visitId = vtca.visitId
        AND (
          tt.fetStartDate IS NOT NULL
          OR tt.fetEndedDate IS NOT NULL
          OR tt.fetStartedBy IS NOT NULL
        )
      WHERE COALESCE(tt.fetStartDate, vpa.fetDate, tt.fetEndedDate) IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM treatment_fet_cycles c
          WHERE c.treatmentCycleId = vtca.id
            AND c.cycleNumber = 1
        )
    `);

    console.log("treatment_fet_cycles migration completed successfully.");
  } catch (error) {
    console.error("Error running migration:", error.message);
    if (error.sql) {
      console.error("SQL Error:", error.sql);
    }
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
