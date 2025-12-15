const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const EmbryologyMaster = MySqlConnection._instance.define(
  "embryologyMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "embryology_master"
  }
);

module.exports = EmbryologyMaster;
