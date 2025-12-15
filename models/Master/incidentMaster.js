const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const IncidentMasterModel = MySqlConnection._instance.define(
  "incidentMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    incidentDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    rootCauseAnalysis: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    action: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    preventiveMeasures:{
        type: Sequelize.TEXT,
        allowNull: false
    },
    impact: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    responsibleEmployees: {
        type: Sequelize.STRING(1000),
        allowNull: false
    },
    isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
    }
  },
  {
    tableName: "incident_master"
  }
);

module.exports = IncidentMasterModel;
