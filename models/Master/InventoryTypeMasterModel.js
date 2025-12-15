const Sequelize = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const InventoryTypeMasterModel = StockMySQLConnection._instance.define(
  "InventoryTypeMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
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
    tableName: "inventory_type_master"
  }
);

module.exports = InventoryTypeMasterModel;
