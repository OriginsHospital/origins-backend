const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const ExpensesMasterModel = MySqlConnection._instance.define(
  "ExpensesMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    branchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    category: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    subCategory: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    amount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMode: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    paymentDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "expenses_master"
  }
);

module.exports = ExpensesMasterModel;
