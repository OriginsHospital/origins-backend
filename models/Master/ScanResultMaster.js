const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const ScanResultMaster = MySqlConnection._instance.define(
  "ScanResultMaster",
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
    scanResult: {
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
    scanTestStatus: {
      type: Sequelize.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "scan_results"
  }
);

module.exports = ScanResultMaster;
