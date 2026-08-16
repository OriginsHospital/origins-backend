/* eslint-disable no-console */
require("dotenv").config();
const mysql = require("mysql2/promise");

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DBNAME,
    timezone: "+05:30"
  });

  const ORDER_ID = 32003;
  const APPOINTMENT_ID = 131388;
  const ITEM_TO_LINE = {
    1331: 39550, // Gurur F
    1208: 39551, // BEE FOLATE
    47: 39552, // ARACHITOL
    421: 39553 // NIPRO SYRINGE 2.5ML
  };

  const [orders] = await conn.query(
    `SELECT id, orderId, appointmentId, type, productType, orderDetails
     FROM order_details_master
     WHERE id = ? AND productType = 'PHARMACY'`,
    [ORDER_ID]
  );
  if (orders.length !== 1) {
    throw new Error(`Expected order ${ORDER_ID}, found ${orders.length}`);
  }

  const order = orders[0];
  if (Number(order.appointmentId) !== APPOINTMENT_ID) {
    throw new Error(
      `Order ${ORDER_ID} appointmentId is ${order.appointmentId}, expected ${APPOINTMENT_ID}`
    );
  }

  const details = JSON.parse(order.orderDetails);
  const updatedDetails = details.map(item => {
    const lineId = ITEM_TO_LINE[item.id];
    if (!lineId) {
      throw new Error(
        `No treatment line mapping for item ${item.id} ${item.itemName}`
      );
    }
    return {
      ...item,
      refId: lineId,
      type: "Treatment"
    };
  });

  await conn.query(
    `UPDATE order_details_master
     SET type = 'Treatment', orderDetails = ?
     WHERE id = ?`,
    [JSON.stringify(updatedDetails), ORDER_ID]
  );

  const [verify] = await conn.query(
    `SELECT id, type, JSON_EXTRACT(orderDetails, '$[*].refId') AS refIds,
            JSON_EXTRACT(orderDetails, '$[*].type') AS itemTypes
     FROM order_details_master WHERE id = ?`,
    [ORDER_ID]
  );
  console.log("UPDATED_ORDER", JSON.stringify(verify, null, 2));
  await conn.end();
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
