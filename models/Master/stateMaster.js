const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const StateMasterModel = MySqlConnection._instance.define(
  "stateMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    name: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    isActive: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.DataTypes.INTEGER,
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
    tableName: "state_master"
  }
);

module.exports = StateMasterModel;
