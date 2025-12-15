const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const treatmentEmbryology = MySqlConnection._instance.define(
  "treatmentEmbryology",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    treatmentCycleId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    categoryType: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true
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
    tableName: "treatement_embryology_association"
  }
);

module.exports = treatmentEmbryology;
