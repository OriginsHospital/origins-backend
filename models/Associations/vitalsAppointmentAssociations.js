const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const VitalsAppointmentAssociations = MySqlConnection._instance.define(
  "VitalsAppointmentAssociations",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    patientId: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    doctorId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    appointmentId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    type: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    appointmentDate: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    weight: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    bp: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    initials: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    height: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    bmi: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    spouseHeight: {
      type: Sequelize.STRING(10),
      allowNull: true
    },
    spouseWeight: {
      type: Sequelize.STRING(10),
      allowNull: true
    },
    spouseBmi: {
      type: Sequelize.STRING(10),
      allowNull: true
    },
    notes: {
      type: Sequelize.STRING(100),
      allowNull: true
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "vitals_appointments_associations"
  }
);

module.exports = VitalsAppointmentAssociations;
