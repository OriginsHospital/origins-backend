const { Sequelize } = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const PatientPurchaseReturnsModel = MySqlConnection._instance.define(
  "PatientPurchaseReturnsModel",
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
    tableName: "patient_purchase_returns"
  }
);

module.exports = PatientPurchaseReturnsModel;
