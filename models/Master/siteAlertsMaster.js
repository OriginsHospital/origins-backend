const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const SiteAlertsMaster = MySqlConnection._instance.define(
  "siteAlertsMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    alertMessage: {
      type: Sequelize.DataTypes.TEXT("long"),
      allowNull: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "site_alerts_master"
  }
);

module.exports = SiteAlertsMaster;
