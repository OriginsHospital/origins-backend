const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const LabTemplatesMaster = MySqlConnection._instance.define(
  "LabTemplatesMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    labTestId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    labTestTemplate: {
      type: Sequelize.TEXT,
      allowNull: false
    }
  },
  {
    tableName: "lab_test_formats"
  }
);

module.exports = LabTemplatesMaster;
