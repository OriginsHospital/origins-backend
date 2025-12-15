const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const visitTreatmentsAssociations = MySqlConnection._instance.define(
  "visitTreatmentsAssociations",
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
    treatmentTypeId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "visit_treatment_cycles_associations"
  }
);

module.exports = visitTreatmentsAssociations;
