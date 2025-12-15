const { Sequelize } = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const ItemsMasterModel = StockMySQLConnection._instance.define(
  "ItemsMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    itemName: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    inventoryType: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    manufacturerName: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    hsnCode: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: true
    },
    categoryName: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    taxCategory: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    departmentId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    isActive: {
      type: Sequelize.DataTypes.TINYINT,
      allowNull: true
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "item_master"
  }
);

module.exports = ItemsMasterModel;
