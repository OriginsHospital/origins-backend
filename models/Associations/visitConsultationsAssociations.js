const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const visitConsultationsAssociations = MySqlConnection._instance.define(
  "visitConsultationsAssociations",
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
    type: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "visit_consultations_associations"
  }
);

module.exports = visitConsultationsAssociations;
