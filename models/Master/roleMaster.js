const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const RoleMasterModel = MySqlConnection._instance.define(
  "roleMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false
    }
  },
  {
    tableName: "role_master"
  }
);

module.exports = RoleMasterModel;
