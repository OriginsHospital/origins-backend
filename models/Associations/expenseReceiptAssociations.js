const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const ExpenseReceiptAssociation = MySqlConnection._instance.define(
  "ExpenseReceiptAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    expenseId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    receiptUrl: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false
    },
    uploadedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    uploadedAt: {
      type: Sequelize.DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    }
  },
  {
    tableName: "expense_receipts_associations",
    timestamps: false
  }
);

module.exports = ExpenseReceiptAssociation;
