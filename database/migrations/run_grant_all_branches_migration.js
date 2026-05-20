const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function runGrantAllBranchesMigration() {
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
      "036_grant_all_branches_to_users.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("Granting all branches to specified users...");
    const [result] = await connection.query(migrationSQL);
    console.log("Migration result:", result);
    console.log("All-branches access migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runGrantAllBranchesMigration();
