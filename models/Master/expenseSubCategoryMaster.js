const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const ExpenseSubCategoryMaster = MySqlConnection._instance.define(
  "expenseSubCategoryMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    ledgerName: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
  },
  {
    tableName: "expense_subcategories_master"
  }
);

module.exports = ExpenseSubCategoryMaster;
