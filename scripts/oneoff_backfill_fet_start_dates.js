/* eslint-disable no-console */
require("dotenv").config();

const moment = require("moment-timezone");
const MySqlConnection = require("../connections/mysql_connection");

async function main() {
  await MySqlConnection.createConnection();
  const sequelize = MySqlConnection._instance;
  if (!sequelize) throw new Error("MySQL connection not initialized");

  const TriggerTimeStampsMaster = require("../models/Master/triggerTimeStampsMaster");

  const [rows] = await sequelize.query(`
    SELECT vpa.visitId, vtc.treatmentTypeId, vpa.fetDate, tt.id AS timestampId, tt.fetStartDate
    FROM visit_packages_associations vpa
    INNER JOIN visit_treatment_cycles_associations vtc ON vtc.visitId = vpa.visitId
    LEFT JOIN treatment_timestamps tt
      ON tt.visitId = vpa.visitId AND tt.treatmentType = vtc.treatmentTypeId
    WHERE vpa.fetDate IS NOT NULL
      AND (tt.fetStartDate IS NULL OR tt.id IS NULL)
  `);

  if (!rows.length) {
    console.log("No FET timestamp backfill needed.");
    await sequelize.close().catch(() => {});
    return;
  }

  console.log(`Backfilling fetStartDate for ${rows.length} visit(s)...`);

  const tx = await sequelize.transaction();
  try {
    for (const row of rows) {
      const fetStartDate = moment(row.fetDate)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");

      if (row.timestampId) {
        await TriggerTimeStampsMaster.update(
          { fetStartDate },
          {
            where: { id: row.timestampId },
            transaction: tx
          }
        );
        console.log(
          `Updated visitId=${row.visitId} timestampId=${row.timestampId} fetStartDate=${fetStartDate}`
        );
      } else {
        await TriggerTimeStampsMaster.create(
          {
            visitId: row.visitId,
            treatmentType: row.treatmentTypeId,
            fetStartDate
          },
          { transaction: tx }
        );
        console.log(
          `Created timestamp for visitId=${row.visitId} fetStartDate=${fetStartDate}`
        );
      }
    }

    await tx.commit();
    console.log("Done.");
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    await sequelize.close().catch(() => {});
  }
}

main().catch(err => {
  console.error("Failed:", err.message);
  process.exitCode = 1;
});
