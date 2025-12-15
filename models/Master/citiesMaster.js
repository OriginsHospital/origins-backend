const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const CityMasterModel = MySqlConnection._instance.define(
  "cityMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: true
    },
    stateId: {
      type: Sequelize.DataTypes.INTEGER,
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
    tableName: "city_master"
  }
);

module.exports = CityMasterModel;
