const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const LabTestMaster = MySqlConnection._instance.define(
  "labTestMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    isOutSourced: {
      type: Sequelize.DataTypes.TINYINT,
      allowNull: true
    },
    labTestGroupId: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    sampleTypeId: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: true
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "lab_test_master"
  }
);

module.exports = LabTestMaster;
