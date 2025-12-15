const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const VisitFetConsentsAssociations = MySqlConnection._instance.define(
  "VisitFetConsentsAssociations",
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
    tableName: "visit_fet_consents_associations"
  }
);

module.exports = VisitFetConsentsAssociations;
