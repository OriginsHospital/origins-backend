const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const PatientOpdSheetAssociations = MySqlConnection._instance.define(
  "PatientOpdSheetAssociations",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    patientId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    template: {
      type: Sequelize.TEXT,
      allowNull: false
    }
  },
  {
    tableName: "patient_opdsheet_associations"
  }
);

module.exports = PatientOpdSheetAssociations;
