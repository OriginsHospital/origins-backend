const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TreatmentAppointmentAssociations = MySqlConnection._instance.define(
  "treatmentAppointmentAssociations",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    treatmentCycleId: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    branchId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    appointmentDate: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    consultationDoctorId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    timeStart: {
      type: Sequelize.TIME,
      allowNull: false
    },
    timeEnd: {
      type: Sequelize.TIME,
      allowNull: false
    },
    appointmentReasonId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    isSeen: {
      type: Sequelize.TINYINT,
      allowNull: true,
      default: 0
    },
    seenAt: {
      type: Sequelize.DATE,
      allowNull: true,
      default: null
    },
    isDone: {
      type: Sequelize.TINYINT,
      allowNull: true,
      default: 0
    },
    doneAt: {
      type: Sequelize.DATE,
      allowNull: true,
      default: null
    },
    isArrived: {
      type: Sequelize.TINYINT,
      allowNull: true,
      default: 0
    },
    arrivedAt: {
      type: Sequelize.DATE,
      allowNull: true,
      default: null
    },
    isScan: {
      type: Sequelize.TINYINT,
      allowNull: true,
      default: 0
    },
    scanAt: {
      type: Sequelize.DATE,
      allowNull: true,
      default: null
    },
    isDoctor: {
      type: Sequelize.TINYINT,
      allowNull: true,
      default: 0
    },
    doctorAt: {
      type: Sequelize.DATE,
      allowNull: true,
      default: null
    },
    stage: {
      type: Sequelize.STRING(100),
      allowNull: true,
      default: "Booked"
    },
    appointmentType: {
      type: Sequelize.STRING(100),
      allowNull: true
    },
    noShow: {
      type: Sequelize.TINYINT,
      allowNull: true,
      default: 0
    },
    noShowReason: {
      type: Sequelize.STRING(255),
      allowNull: true,
      default: null
    },
    isCompleted: {
      type: Sequelize.TINYINT,
      allowNull: true,
      default: 0
    },
    isReviewAppointmentCreated: {
      type: Sequelize.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "treatment_appointments_associations"
  }
);

module.exports = TreatmentAppointmentAssociations;
