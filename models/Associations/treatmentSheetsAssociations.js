const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TreatmentSheetsAssociations = MySqlConnection._instance.define(
  "treatmentSheetsAssociations",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    treatmentCycleId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    template: {
        type: Sequelize.TEXT,
        allowNull: false
    }
  },
  {
    tableName: "treatment_sheets_associations"
  }
);

module.exports = TreatmentSheetsAssociations;
