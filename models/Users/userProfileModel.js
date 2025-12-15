const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const UserProfile = MySqlConnection._instance.define(
  "user_profile",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    fullName: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    userName: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    email: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    phoneNo: {
      type: Sequelize.STRING(100),
      allowNull: true
    },
    addressLine1: {
      type: Sequelize.STRING(200),
      allowNull: true
    },
    addressLine2: {
      type: Sequelize.STRING(200),
      allowNull: true
    },
    country: {
      type: Sequelize.STRING(100),
      allowNull: true
    },
    state: {
      type: Sequelize.STRING(100),
      allowNull: true
    }
  },
  {
    tableName: "user_profile"
  }
);

module.exports = UserProfile;
