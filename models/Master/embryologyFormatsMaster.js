const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const EmbryologyFormatMaster = MySqlConnection._instance.define(
  "embryologyFormatMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    embryologyId: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    embryologyTemplate: {
        type: Sequelize.TEXT,
        allowNull: true
    }
  },
  {
    tableName: "embryology_formats"
  }
);

module.exports = EmbryologyFormatMaster;
