const { Sequelize } = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const GrnPaymentsMasterModel = StockMySQLConnection._instance.define(
  "GrnPaymentsMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    orderId: {
      type: Sequelize.DataTypes.STRING(200),
      allowNull: false
    },
    grnNo: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    amount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    typeOfPayment: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    paymentDate: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    },
    remarks: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    tableName: "grn_payments_master"
  }
);

module.exports = GrnPaymentsMasterModel;
