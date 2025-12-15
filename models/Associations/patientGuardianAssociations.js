const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const PatientGuardianAssociations = MySqlConnection._instance.define(
  "patientGuardianAssociations",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    patientId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    age: {
      type: Sequelize.DataTypes.STRING(10),
      allowNull: true
    },
    gender: {
      type: Sequelize.DataTypes.STRING(10),
      allowNull: true
    },
    email: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    aadhaarNo: {
      type: Sequelize.DataTypes.STRING(12),
      allowNull: true
    },
    relation: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: false
    },
    bloodGroup: {
      type: Sequelize.STRING(10),
      allowNull: true
    },
    additionalDetails: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: "patient_guardian_associations"
  }
);

module.exports = PatientGuardianAssociations;
