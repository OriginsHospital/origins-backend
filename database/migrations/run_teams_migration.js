const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

async function runTeamsMigration() {
  let connection;

  try {
    // Create database connection
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

    // Read the migration file
    const migrationPath = path.join(__dirname, "020_create_teams_tables.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("Executing Teams tables migration...");

    // Execute the migration
    await connection.query(migrationSQL);

    console.log("✅ Teams tables migration completed successfully!");
    console.log("Created tables:");
    console.log("  - team_chats");
    console.log("  - team_chat_members");
    console.log("  - team_messages");
    console.log("  - team_meetings");
    console.log("  - team_meeting_participants");
    console.log("  - team_calendar_events");
    console.log("  - team_schedules");
    console.log("  - team_calls");
  } catch (error) {
    console.error("❌ Error running migration:", error.message);
    if (error.sql) {
      console.error("SQL Error:", error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("Database connection closed");
    }
  }
}

// Run the migration
runTeamsMigration();
