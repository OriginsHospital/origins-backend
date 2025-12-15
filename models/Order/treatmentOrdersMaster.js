const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TreatmentOrdersMaster = MySqlConnection._instance.define(
  "TreatmentOrderMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
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
    visitId: {
      type: Sequelize.INTEGER,
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
    productType: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    type: {
      type: Sequelize.STRING(100),
      allowNull: true
    },
    comments: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    dueDate: {
      type: Sequelize.DATEONLY,
      allowNull: true
    }
  },
  {
    tableName: "treatment_orders_master",
    timestamps: false
  }
);

module.exports = TreatmentOrdersMaster;
