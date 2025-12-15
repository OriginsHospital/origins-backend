const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const LabTestResultsModel = MySqlConnection._instance.define(
  "LabTestResultsModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    labTestId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    labTestResult: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    appointmentId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    type: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    isSpouse: {
      type: Sequelize.DataTypes.TINYINT,
      allowNull: true
    },
    labTestStatus: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    sampleCollectedOn: {
      type: Sequelize.DATE,
      allowNull: true
    }
  },
  {
    tableName: "lab_test_results"
  }
);

module.exports = LabTestResultsModel;
