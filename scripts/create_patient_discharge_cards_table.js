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
    path.join(
      __dirname,
      "../database/migrations/055_create_patient_discharge_cards.sql"
    ),
    "utf8"
  );
  await conn.query(createSql);

  const [tables] = await conn.query(
    "SHOW TABLES LIKE 'patient_discharge_cards'"
  );
  console.log("table exists:", tables.length > 0);

  const [cols] = await conn.query("SHOW COLUMNS FROM patient_discharge_cards");
  console.log("columns:", cols.map(c => c.Field).join(", "));

  await conn.end();
})().catch(e => {
  console.error("ERR", e.message);
  process.exit(1);
});
