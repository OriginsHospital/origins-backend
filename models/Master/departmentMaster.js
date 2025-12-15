const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const DepartmentMasterModel = MySqlConnection._instance.define(
  "departmentMaster",
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
        type: Sequelize.TINYINT,
        allowNull: false
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
    tableName: "department_master"
  }
);

module.exports = DepartmentMasterModel;
