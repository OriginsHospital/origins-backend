const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function columnExists(connection, tableName, columnName) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return Number(rows?.[0]?.count) > 0;
}

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
          : process.env.MYSQL_DBNAME_PROD
    });

    console.log("Connected to database successfully");

    if (
      !(await columnExists(connection, "scan_formats", "originalScanTemplate"))
    ) {
      console.log("Adding originalScanTemplate column to scan_formats...");
      await connection.query(
        `ALTER TABLE scan_formats
         ADD COLUMN originalScanTemplate LONGTEXT NULL AFTER scanTemplate`
      );
    }

    if (!(await columnExists(connection, "scan_formats", "updatedBy"))) {
      console.log("Adding updatedBy column to scan_formats...");
      await connection.query(
        `ALTER TABLE scan_formats
         ADD COLUMN updatedBy INT NULL AFTER originalScanTemplate`
      );
    }

    if (!(await columnExists(connection, "scan_formats", "updatedAt"))) {
      console.log("Adding updatedAt column to scan_formats...");
      await connection.query(
        `ALTER TABLE scan_formats
         ADD COLUMN updatedAt DATETIME NULL AFTER updatedBy`
      );
    }

    const [result] = await connection.query(
      `UPDATE scan_formats
       SET originalScanTemplate = scanTemplate
       WHERE originalScanTemplate IS NULL
         AND scanTemplate IS NOT NULL`
    );
    console.log(
      `Backfilled originalScanTemplate for ${result?.affectedRows || 0} row(s).`
    );
    console.log("scan_formats original template migration completed.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
