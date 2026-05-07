const { Sequelize } = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const GrnBranchTransferMasterModel = StockMySQLConnection._instance.define(
  "GrnBranchTransferMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    sourceGrnId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    transferGrnId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    sourceBranchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    destinationBranchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    itemId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    transferredQuantity: {
      type: Sequelize.DataTypes.BIGINT,
      allowNull: false
    },
    transferDate: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    },
    transferInvoiceNumber: {
      type: Sequelize.DataTypes.STRING(120),
      allowNull: false
    },
    transferredBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "grn_branch_transfer_master"
  }
);

module.exports = GrnBranchTransferMasterModel;
