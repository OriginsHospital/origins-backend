const Sequelize = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const TaxCategoryMasterModel = StockMySQLConnection._instance.define(
  "TaxCategoryMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    categoryName: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    taxPercent: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "tax_category_master"
  }
);

module.exports = TaxCategoryMasterModel;
