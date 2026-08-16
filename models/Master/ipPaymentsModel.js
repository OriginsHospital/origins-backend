const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const IpPaymentsModel = MySqlConnection._instance.define(
  "ipPayments",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    ipId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    patientId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    paymentMode: {
      type: Sequelize.DataTypes.STRING(30),
      allowNull: false
    },
    roomAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    medicineAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    packageAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    otherAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    otherDescription: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    totalAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    remarks: {
      type: Sequelize.DataTypes.STRING(500),
      allowNull: true
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "ip_payments"
  }
);

module.exports = IpPaymentsModel;
