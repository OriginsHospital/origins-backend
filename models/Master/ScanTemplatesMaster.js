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
    }
  },
  {
    tableName: "scan_formats"
  }
);

module.exports = ScanTemplatesMaster;
