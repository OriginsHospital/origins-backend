const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const OtherPaymentsOrderMaster = MySqlConnection._instance.define(
  "OtherPaymentsOrderMasterModel",
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
    orderId: {
      type: Sequelize.DataTypes.STRING(200),
      allowNull: true
    },
    transactionId: {
      type: Sequelize.DataTypes.STRING(200),
      allowNull: true
    },
    totalOrderAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    pendingOrderAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paidOrderAmountBeforeDiscount: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false
    },
    couponCode: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    discountAmount: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false
    },
    paidOrderAmount: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false
    },
    paymentStatus: {
      type: Sequelize.DataTypes.STRING(200),
      allowNull: false,
      defaultValue: "DUE"
    },
    orderDate: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    },
    paymentMode: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    type: {
      type: Sequelize.STRING(100),
      allowNull: true,
      default: "Treatment"
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  },
  {
    tableName: "other_payment_orders_master"
  }
);

module.exports = OtherPaymentsOrderMaster;
