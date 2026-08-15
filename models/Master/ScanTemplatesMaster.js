const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const ScanTemplatesMaster = MySqlConnection._instance.define(
  "ScanTemplatesMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    scanId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    scanTemplate: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    originalScanTemplate: {
      type: Sequelize.TEXT("long"),
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: true
    }
  },
  {
    tableName: "scan_formats",
    timestamps: false
  }
);

module.exports = ScanTemplatesMaster;
