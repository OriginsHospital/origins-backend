const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const UserBranchAssociationModel = MySqlConnection._instance.define(
  "userBranchAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    userId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    branchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "user_branch_association"
  }
);

module.exports = UserBranchAssociationModel;
