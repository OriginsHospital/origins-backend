const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const ReferralsMasterModel = MySqlConnection._instance.define(
  "referralsMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING(50),
      allowNull: true
    },
    isActive: {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  },
  {
    tableName: "referral_type_master"
  }
);

module.exports = ReferralsMasterModel;
