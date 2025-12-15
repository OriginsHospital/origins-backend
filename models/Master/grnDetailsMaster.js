const { Sequelize } = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const GrnDetailsMasterModel = StockMySQLConnection._instance.define(
  "GrnDetailsMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    grnNo: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    branchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    date: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    },
    supplierId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    supplierEmail: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    supplierAddress: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    supplierGstNumber: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    invoiceNumber: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    }
  },
  {
    tableName: "grn_master"
  }
);

module.exports = GrnDetailsMasterModel;
