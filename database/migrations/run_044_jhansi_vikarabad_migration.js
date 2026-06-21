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
      "044_associate_jhansi_vikarabad.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("Associating Dr. Jhansi with Vikarabad branch...");
    const [result] = await connection.query(migrationSQL);
    console.log("Migration result:", result);
    console.log("Dr. Jhansi / Vikarabad association migration completed.");
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
