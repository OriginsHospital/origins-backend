require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_STOCKDBNAME,
    port: Number(process.env.MYSQL_PORT || 3306),
    multipleStatements: true
  });

  const sql = fs.readFileSync(
    path.join(
      __dirname,
      "../database/migrations/057_add_grn_entry_and_soft_delete.sql"
    ),
    "utf8"
  );
  await conn.query(sql);

  const [grnMasterCols] = await conn.query(
    "SHOW COLUMNS FROM stockmanagement.grn_master LIKE 'createdBy'"
  );
  const [itemCols] = await conn.query(
    "SHOW COLUMNS FROM stockmanagement.grn_items_associations WHERE Field IN ('isDeleted', 'deletedQuantity', 'deletedBy', 'deletedAt')"
  );
  console.log("grn_master.createdBy:", grnMasterCols.length > 0);
  console.log(
    "grn_items_associations columns:",
    itemCols.map(c => c.Field).join(", ")
  );

  await conn.end();
})().catch(e => {
  console.error("ERR", e.message);
  process.exit(1);
});
