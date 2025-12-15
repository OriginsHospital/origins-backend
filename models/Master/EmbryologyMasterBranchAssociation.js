const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const EmbryologyMasterBranchAssociation = MySqlConnection._instance.define(
  "embryologyMasterBranchAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    embryologyId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    branchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    isActive: {
      type: Sequelize.DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 1
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "embryology_master_branch_association"
  }
);

module.exports = EmbryologyMasterBranchAssociation;
