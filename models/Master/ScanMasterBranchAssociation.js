const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const ScanMasterBranchAssociation = MySqlConnection._instance.define(
  "scanMasterBranchAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    scanId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    branchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    isFormFRequired: {
      type: Sequelize.DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    amount: {
      type: Sequelize.DataTypes.DOUBLE(10, 2),
      allowNull: false
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
    updatedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE
    }
  },
  {
    tableName: "scan_master_branch_association"
  }
);

module.exports = ScanMasterBranchAssociation;
