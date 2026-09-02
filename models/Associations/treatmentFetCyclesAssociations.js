const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TreatmentFetCyclesAssociations = MySqlConnection._instance.define(
  "treatmentFetCyclesAssociations",
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
    treatmentCycleId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    cycleNumber: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    fetStartDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    fetStartedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    fetEndedDate: {
      type: Sequelize.DATE,
      allowNull: true
    },
    fetEndedReason: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    fetEndedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "treatment_fet_cycles"
  }
);

module.exports = TreatmentFetCyclesAssociations;
