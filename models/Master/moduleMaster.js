const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const ModuleMasterModel = MySqlConnection._instance.define(
  "moduleMaster",
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
    },
    moduleEnum: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      default: 1
    }
  },
  {
    tableName: "module_master"
  }
);

module.exports = ModuleMasterModel;
