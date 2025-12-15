const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const treatmentAppointmentNotesAssociations = MySqlConnection._instance.define(
  "treatmentAppointmentNotesAssociations",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    appointmentId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    notes: {
      type: Sequelize.DataTypes.TEXT("long"),
      allowNull: false
    },
    isSpouse: {
      type: Sequelize.DataTypes.TINYINT,
      allowNull: true
    },
    isDone: {
      type: Sequelize.DataTypes.TINYINT,
      defaultValue: 0
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "treatment_appointment_notes_associations"
  }
);

module.exports = treatmentAppointmentNotesAssociations;
