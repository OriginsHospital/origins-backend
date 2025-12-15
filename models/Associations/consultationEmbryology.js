const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const consultationEmbryology = MySqlConnection._instance.define(
  "consultationEmbryology",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    consultationId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    categoryType: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false
    },
    imageLink: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true
    },
    template: {
      type: Sequelize.DataTypes.TEXT("long"),
      allowNull: false
    },
    embryologyType: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "consultation_embryology_association"
  }
);

module.exports = consultationEmbryology;
