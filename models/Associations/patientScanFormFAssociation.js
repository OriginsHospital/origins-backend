const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const patientScanFormFAssociations = MySqlConnection._instance.define(
  "patientScanFormFAssociations",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    appointmentId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    scanId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    formFTemplate: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false
    },
    formFUploadKey: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    formFUploadLink: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    isReviewed: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      default: false
    }
  },
  {
    tableName: "patient_scan_formf_associations"
  }
);

module.exports = patientScanFormFAssociations;
