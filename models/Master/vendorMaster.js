const Sequelize = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const VendorMasterModel = StockMySQLConnection._instance.define(
  "vendorMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    departmentId: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
    },
    isActive: {
        type: Sequelize.TINYINT,
        allowNull: false
    },
    createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
    }
  },
  {
    tableName: "vendor_master"
  }
);

module.exports = VendorMasterModel;
