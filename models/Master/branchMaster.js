const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const BranchMasterModel = MySqlConnection._instance.define(
  "branchMaster",
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
    }
  },
  {
    tableName: "branch_master"
  }
);

module.exports = BranchMasterModel;
