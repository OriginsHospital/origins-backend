const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const VisitEraConsentsAssociations = MySqlConnection._instance.define(
  "VisitEraConsentsAssociations",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    visitId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    key: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    link: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "visit_era_consents_associations"
  }
);

module.exports = VisitEraConsentsAssociations;
