const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const ConsentTemplatesMaster = MySqlConnection._instance.define(
  "ConsentTemplatesMaster",
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
    fileName: {
      type: Sequelize.STRING(100),
      allowNull: true
    },
    consentTemplate: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    consentType: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    }
  },
  {
    tableName: "consent_formats"
  }
);

module.exports = ConsentTemplatesMaster;
