const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const LabTestGroupMaster = MySqlConnection._instance.define(
  "labTestGroupMaster",
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
    isActive: {
          type: Sequelize.BOOLEAN,
          allowNull: true
    },
    createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
    }
  },
  {
    tableName: "lab_test_group_master"
  }
);

module.exports = LabTestGroupMaster;
