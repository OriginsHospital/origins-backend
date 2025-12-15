const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const BranchBuildingAssociationModel = MySqlConnection._instance.define(
  "branchBuildingAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    branchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "branch_building_association"
  }
);

module.exports = BranchBuildingAssociationModel;
