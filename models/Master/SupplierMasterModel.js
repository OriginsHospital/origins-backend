const Sequelize = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const SupplierMasterModel = StockMySQLConnection._instance.define(
  "SupplierMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    supplier: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    gstNumber: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: false
    },
    contactPerson: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    contactNumber: {
      type: Sequelize.DataTypes.STRING(20),
      allowNull: false
    },
    emailId: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    tinNumber: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: true
    },
    panNumber: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: true
    },
    dlNumber: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: true
    },
    address: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    accountDetails: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    remarks: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: Sequelize.DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "supplier_master"
  }
);

module.exports = SupplierMasterModel;
