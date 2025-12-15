const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TreatmentDischargeSummarySheetAssociations = MySqlConnection._instance.define(
  "TreatmentDischargeSummarySheetAssociations",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    treatmentCycleId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    template: {
        type: Sequelize.TEXT,
        allowNull: false
    }
  },
  {
    tableName: "treatment_dischargesummarysheet_associations"
  }
);

module.exports = TreatmentDischargeSummarySheetAssociations;
