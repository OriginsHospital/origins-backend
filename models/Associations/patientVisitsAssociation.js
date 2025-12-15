const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const patientVisitsAssociation = MySqlConnection._instance.define(
  "patientVisitsAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    patientId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    isActive: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false
    },
    visitDate: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    },
    packageChosen: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    visitClosedStatus: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    visitClosedReason: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    closedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "patient_visits_association"
  }
);

module.exports = patientVisitsAssociation;
