const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const consultationAppointmentNotesAssociations = MySqlConnection._instance.define(
  "consultationAppointmentNotesAssociations",
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
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "consultation_appointment_notes_associations"
  }
);

module.exports = consultationAppointmentNotesAssociations;
