const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TriggerTimeStampsModel = MySqlConnection._instance.define(
  "triggerTimeStampsModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    visitId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    treatmentType: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    startDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    startedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    triggerStartDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    triggerStartedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    hysteroscopyTime: {
      type: Sequelize.DATE,
      allowNull: true
    },
    hysteroscopyStartedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    hysteroscopySheet: {
      type: Sequelize.TEXT("long"),
      allowNull: true
    },
    fetStartDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    fetStartedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    eraStartDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    eraStartedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    endedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    endedReason: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    endDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    fetEndedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    fetEndedReason: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    fetEndedDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    eraEndedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    eraEndedReason: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    eraEndedDate: {
      type: Sequelize.DATE,
      allowNull: true
    }
  },
  {
    tableName: "treatment_timestamps"
  }
);

module.exports = TriggerTimeStampsModel;
