const { Sequelize } = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const GrnPaymentAssociations = StockMySQLConnection._instance.define(
  "GrnPaymentAssociations",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    grnId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    subTotal: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    overAllDiscountPercentage: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    overAllDiscountAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    netAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    taxAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    otherCharges: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    freight: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    cst: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    excise: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    cess: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    creditNoteAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    netPayable: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    remarks: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    }
  },
  {
    tableName: "grn_payment_details_associations"
  }
);

module.exports = GrnPaymentAssociations;
