const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function runBackfill() {
  const connection = await mysql.createConnection({
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

  const migrationPath = path.join(
    __dirname,
    "042_backfill_referring_doctors_log.sql"
  );
  const migrationSQL = fs.readFileSync(migrationPath, "utf8");

  console.log("Backfilling referring doctors log...");
  await connection.query(migrationSQL);

  const [logs] = await connection.query(
    "SELECT id, doctorName, action FROM referring_doctors_log ORDER BY id DESC"
  );
  console.log("Log rows:", logs);

  await connection.end();
}

runBackfill().catch(err => {
  console.error(err.message);
  process.exit(1);
});
