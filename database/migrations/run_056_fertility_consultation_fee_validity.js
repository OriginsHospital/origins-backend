const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function runFertilityConsultationFeeValidityMigration() {
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
      "056_update_fertility_consultation_fee_validity.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("Updating Fertility consultation fee validity to 90 days...");
    const [result] = await connection.query(migrationSQL);
    console.log("Update result:", result);

    const [fees] = await connection.query(`
      SELECT
        bm.branchCode,
        vtm.id AS visitTypeId,
        vtm.name AS visitType,
        cfba.amount,
        cfba.validity
      FROM consultation_fee_branch_association cfba
      INNER JOIN branch_master bm ON bm.id = cfba.branchId
      LEFT JOIN visit_type_master vtm ON vtm.id = cfba.patientTypeId
      ORDER BY bm.branchCode, cfba.patientTypeId
    `);
    console.log("Consultation fee validity after update:", fees);
    console.log("Fertility consultation fee validity migration completed.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runFertilityConsultationFeeValidityMigration();
