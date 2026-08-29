require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Sequelize } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");
const {
  isFetReport,
  isIcsiReport,
  ensureFetIcsiRenewalDate
} = require("../utils/embryologyRenewalDate");

const snippetAround = (html, needle, radius = 280) => {
  const idx = String(html).search(new RegExp(needle, "i"));
  if (idx === -1) return "(not found)";
  return html.slice(Math.max(0, idx - radius), idx + radius);
};

async function updateTable(connection, tableName, idColumn, report) {
  const rows = await connection.query(
    `SELECT id, template FROM ${tableName} WHERE embryologyType = :embryologyType`,
    {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { embryologyType: report.id }
    }
  );

  let updated = 0;
  for (const row of rows) {
    const next = ensureFetIcsiRenewalDate(row.template, report);
    if (next === row.template) continue;
    await connection.query(
      `UPDATE ${tableName} SET template = :template WHERE id = :id`,
      {
        replacements: { template: next, id: row.id }
      }
    );
    updated += 1;
  }
  return { total: rows.length, updated };
}

async function main() {
  await MySqlConnection.createConnection();
  const connection = MySqlConnection._instance;

  const formats = await connection.query(
    `SELECT ef.id, ef.embryologyId, em.name, ef.embryologyTemplate
     FROM embryology_formats ef
     JOIN embryology_master em ON em.id = ef.embryologyId
     WHERE em.id IN (5, 6)`,
    { type: Sequelize.QueryTypes.SELECT }
  );

  if (!formats.length) {
    throw new Error("FET/ICSI templates not found in embryology_formats");
  }

  for (const row of formats) {
    const report = { id: row.embryologyId, name: row.name };
    if (!isFetReport(report) && !isIcsiReport(report)) {
      console.log(`Skipping ${row.name}`);
      continue;
    }

    const updatedTemplate = ensureFetIcsiRenewalDate(
      row.embryologyTemplate,
      report
    );

    if (updatedTemplate === row.embryologyTemplate) {
      console.log(`${row.name}: already has RENEWAL DATE`);
    } else {
      await connection.query(
        `UPDATE embryology_formats SET embryologyTemplate = :template WHERE id = :id`,
        {
          replacements: { template: updatedTemplate, id: row.id }
        }
      );
      console.log(`${row.name}: master template updated`);
    }

    const treatment = await updateTable(
      connection,
      "treatement_embryology_association",
      "id",
      report
    );
    const consultation = await updateTable(
      connection,
      "consultation_embryology_association",
      "id",
      report
    );
    console.log(
      `${row.name}: saved reports treatment ${treatment.updated}/${treatment.total}, consultation ${consultation.updated}/${consultation.total}`
    );
    console.log(snippetAround(updatedTemplate, "RENEWAL DATE"));
    console.log("---");
  }

  const outDir = path.join(__dirname, "_tmp_templates");
  fs.mkdirSync(outDir, { recursive: true });
  const verify = await connection.query(
    `SELECT ef.embryologyId, em.name, ef.embryologyTemplate
     FROM embryology_formats ef
     JOIN embryology_master em ON em.id = ef.embryologyId
     WHERE em.id IN (5, 6)`,
    { type: Sequelize.QueryTypes.SELECT }
  );
  for (const row of verify) {
    fs.writeFileSync(
      path.join(outDir, `updated_${row.embryologyId}.html`),
      row.embryologyTemplate,
      "utf8"
    );
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
