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
          : process.env.MYSQL_DBNAME_PROD,
      multipleStatements: true
    });

    console.log("Connected to database successfully");

    const migrationPath = path.join(
      __dirname,
      "045_add_vkb_consultation_fees.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("Adding VKB consultation fees (matching HYD)...");
    const [result] = await connection.query(migrationSQL);
    console.log("Migration result:", result);

    const [fees] = await connection.query(`
      SELECT cfba.amount, cfba.validity, vtm.name AS visitType
      FROM consultation_fee_branch_association cfba
      INNER JOIN branch_master bm ON bm.id = cfba.branchId
      LEFT JOIN visit_type_master vtm ON vtm.id = cfba.patientTypeId
      WHERE bm.branchCode = 'VKB'
      ORDER BY cfba.patientTypeId
    `);
    console.log("VKB consultation fees:", fees);
    console.log("VKB consultation fee migration completed.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
