const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function runReferringDoctorsMigration() {
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
      "041_create_referring_doctors.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("Executing referring doctors migration...");
    await connection.query(migrationSQL);
    console.log("Referring doctors migration completed successfully.");
  } catch (error) {
    console.error("Error running migration:", error.message);
    if (error.sql) {
      console.error("SQL Error:", error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runReferringDoctorsMigration();
