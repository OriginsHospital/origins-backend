const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const PaymentsMasterModel = MySqlConnection._instance.define(
  "PaymentsMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    branchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    paymentDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: false
    },
    departmentId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    vendorId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: Sequelize.DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.0
    },
    invoiceUrl: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    receiptUrl: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "payments"
  }
);

module.exports = PaymentsMasterModel;
