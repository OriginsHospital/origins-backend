const Sequelize = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const PharmacyPurchaseDetailsTemp = StockMySQLConnection._instance.define(
  "PharmacyPurchaseDetailsTemp",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    refId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    purchaseDetails: {
      type: Sequelize.STRING(1000),
      allowNull: false
    },
    purchaseQuantity: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "pharmacy_purchase_details_temp"
  }
);

module.exports = PharmacyPurchaseDetailsTemp;
