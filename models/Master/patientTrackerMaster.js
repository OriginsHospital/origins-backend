const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const PatientTrackerModel = MySqlConnection._instance.define(
  "PatientTracker",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    date: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: false
    },
    branchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    patientId: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    patientName: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    mobileNumber: {
      type: Sequelize.DataTypes.STRING(15),
      allowNull: true
    },
    referralSourceId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    referralName: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    plan: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    treatmentType: {
      type: Sequelize.DataTypes.ENUM("IVF", "OI-TI", "IUI"),
      allowNull: false
    },
    cycleStatus: {
      type: Sequelize.DataTypes.ENUM(
        "Not Started",
        "Registered",
        "Running",
        "Complete",
        "Cancelled"
      ),
      allowNull: false
    },
    stageOfCycle: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    packageName: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    packageAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    registrationAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    paidAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    pendingAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    icsiD1: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    opu: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    fetD1: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    fet: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    numberOfEmbryos: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    numberOfEmbryosUsed: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    numberOfEmbryosDiscarded: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    lastRenewalDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    embryosRemaining: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    uptResult: {
      type: Sequelize.DataTypes.ENUM("Positive", "Negative", "Others"),
      allowNull: true
    },
    uptManualEntry: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    notes: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    }
  },
  {
    tableName: "patient_tracker"
  }
);

module.exports = PatientTrackerModel;
