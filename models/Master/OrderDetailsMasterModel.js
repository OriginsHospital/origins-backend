const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const OrderDetailsMasterModel = MySqlConnection._instance.define(
  "OrderDetailsMasterModel",
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
    transactionId: {
      type: Sequelize.DataTypes.STRING(200),
      allowNull: true
    },
    totalOrderAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    discountAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paidOrderAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    couponCode: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    paymentStatus: {
      type: Sequelize.DataTypes.STRING(200),
      allowNull: false,
      defaultValue: "DUE"
    },
    orderDetails: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false
    },
    orderDate: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    },
    paymentMode: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    transactionType: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    productType: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    appointmentId: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    type: {
      type: Sequelize.STRING(100),
      allowNull: true
    }
  },
  {
    tableName: "order_details_master"
  }
);

module.exports = OrderDetailsMasterModel;
