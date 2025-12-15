const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const PatientMasterModel = MySqlConnection._instance.define(
  "patientMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    patientId: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    branchId: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: false
    },
    aadhaarNo: {
      type: Sequelize.DataTypes.STRING(12),
      unique: true,
      allowNull: false
    },
    mobileNo: {
      type: Sequelize.DataTypes.STRING(10),
      allowNull: false
    },
    email: {
      type: Sequelize.DataTypes.STRING(90),
      allowNull: true
    },
    firstName: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: false
    },
    lastName: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: true
    },
    gender: {
      type: Sequelize.DataTypes.ENUM("Male", "Female", "Other"),
      allowNull: false
    },
    maritalStatus: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: false
    },
    dateOfBirth: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    },
    bloodGroup: {
      type: Sequelize.STRING(10),
      allowNull: true
    },
    addressLine1: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    addressLine2: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    cityId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    stateId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    patientTypeId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    referralId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    referralName: {
      type: Sequelize.DataTypes.STRING(90),
      allowNull: true
    },
    pincode: {
      type: Sequelize.DataTypes.STRING(6),
      allowNull: true
    },
    photoPath: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    aadhaarCard: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    marriageCertificate: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    affidavit: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    uploadedDocuments: {
      type: Sequelize.DataTypes.JSON,
      allowNull: true
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
    tableName: "patient_master"
  }
);

module.exports = PatientMasterModel;
