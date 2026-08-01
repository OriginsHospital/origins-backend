require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DBNAME,
    port: Number(process.env.MYSQL_PORT || 3306),
    multipleStatements: true
  });

  const createSql = fs.readFileSync(
    path.join(__dirname, "../database/create_patient_tracker_table_simple.sql"),
    "utf8"
  );
  await conn.query(createSql);
  console.log("create_patient_tracker_table_simple.sql: applied");

  const alterSql = fs.readFileSync(
    path.join(
      __dirname,
      "../database/alter_patient_tracker_add_clinical_fields.sql"
    ),
    "utf8"
  );
  try {
    await conn.query(alterSql);
    console.log("alter clinical fields: applied");
  } catch (e) {
    console.log("alter clinical fields:", e.message);
  }

  const [tables] = await conn.query("SHOW TABLES LIKE 'patient_tracker'");
  console.log("table exists:", tables.length > 0);
  const [cols] = await conn.query("SHOW COLUMNS FROM patient_tracker");
  console.log("columns:", cols.map(c => c.Field).join(", "));

  await conn.end();
})().catch(e => {
  console.error("ERR", e.message);
  process.exit(1);
});
