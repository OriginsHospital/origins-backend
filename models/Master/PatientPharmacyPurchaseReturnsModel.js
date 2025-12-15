const { Sequelize } = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const PatientPharmacyPurchaseReturnsModel = StockMySQLConnection._instance.define(
  "PatientPharmacyPurchaseReturnsModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    patientId: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    orderId: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    returnDetails: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    returnedDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    totalAmount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    }
  },
  {
    tableName: "patient_pharamacy_purchase_returns"
  }
);

module.exports = PatientPharmacyPurchaseReturnsModel;
