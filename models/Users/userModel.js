const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const UsersModel = MySqlConnection._instance.define(
  "users",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    fullName: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    email: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    password: {
      type: Sequelize.STRING(200),
      allowNull: false
    },
    roleId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    userName: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    isAdminVerified: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    },
    isEmailVerified: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    },
    isBlocked: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    tableName: "users"
  }
);

module.exports = UsersModel;
