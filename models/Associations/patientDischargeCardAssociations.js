const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const PatientDischargeCardAssociations = MySqlConnection._instance.define(
  "PatientDischargeCardAssociations",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    visitId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    patientId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    appointmentId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    appointmentType: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: true
    },
    treatmentCycleId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    cardData: {
      type: Sequelize.DataTypes.JSON,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "patient_discharge_cards"
  }
);

module.exports = PatientDischargeCardAssociations;
