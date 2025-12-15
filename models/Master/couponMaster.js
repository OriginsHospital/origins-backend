const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const CouponMasterModel = MySqlConnection._instance.define(
  "CouponMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    couponCode: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    discountPercentage: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
    },
    createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
  },
  {
    tableName: "coupon_master"
  }
);

module.exports = CouponMasterModel;
