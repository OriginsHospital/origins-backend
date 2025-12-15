const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const OrderSupplyItemsModel = MySqlConnection._instance.define(
  "OrderSupplyItemsModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    orderId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    supplyItemId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    quantity: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "order_supply_items"
  }
);

module.exports = OrderSupplyItemsModel;
