const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const LabTestMasterBranchAssociation = MySqlConnection._instance.define(
  "labTestMasterBranchAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    labTestId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    branchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    sampleTypeId: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    labTestGroupId: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    },
    isOutSourced: {
      type: Sequelize.DataTypes.TINYINT,
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
    tableName: "lab_test_master_branch_association"
  }
);

module.exports = LabTestMasterBranchAssociation;
