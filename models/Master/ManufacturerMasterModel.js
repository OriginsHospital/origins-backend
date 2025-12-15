const { DataTypes } = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const ManufacturerMasterModel = StockMySQLConnection._instance.define(
  "ManufacturerMasterModel",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    manufacturer: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    contactPerson: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    contactNumber: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    fax: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    alternateContact: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    emailId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    apgstNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    cstNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    tinNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    dlNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    panNumber: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "manufacturer_master"
  }
);

module.exports = ManufacturerMasterModel;
