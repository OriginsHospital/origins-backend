const Sequelize = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const SuppliesMasterModel = StockMySQLConnection._instance.define(
  "suppliesMaster",
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
    tableName: "supplies_master"
  }
);

module.exports = SuppliesMasterModel;
