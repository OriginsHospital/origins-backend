const { Sequelize } = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const GrnItemsReturnModel = StockMySQLConnection._instance.define(
  "GrnItemsReturnModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    grnId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    supplierId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    returnDetails: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    totalAmount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    }
  },
  {
    tableName: "grn_item_returns"
  }
);

module.exports = GrnItemsReturnModel;
