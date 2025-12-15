const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const OrdersMasterModel = MySqlConnection._instance.define(
  "OrdersMasterModel",
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
    orderDate: {
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
    orderStatus: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    expectedArrivalDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    receivedDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    invoiceUrl: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    paymentAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    paymentDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    isActive: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: true
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
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
    tableName: "orders_master"
  }
);

module.exports = OrdersMasterModel;
