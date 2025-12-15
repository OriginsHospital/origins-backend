const { Sequelize } = require("sequelize");
const StockMySQLConnection = require("../../connections/stock_mysql_connection");

const GrnItemsAssociationsModel = StockMySQLConnection._instance.define(
  "GrnItemsAssociationsModel",
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
    itemId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    batchNo: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    expiryDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    pack: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    quantity: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    freeQuantity: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    intialQuantity: {
      type: Sequelize.DataTypes.BIGINT,
      allowNull: true
    },
    totalQuantity: {
      type: Sequelize.DataTypes.BIGINT,
      allowNull: true
    },
    mrp: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    rate: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    mrpPerTablet: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    ratePerTablet: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    discountPercentage: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    taxPercentage: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    discountAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    taxAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    amount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    isReturned: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      default: false
    }
  },
  {
    tableName: "grn_items_associations"
  }
);

module.exports = GrnItemsAssociationsModel;
