const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const LabPatientImages = MySqlConnection._instance.define(
  "LabPatientImages",
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
    type: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: false
    },
    imageType: {
      type: Sequelize.DataTypes.ENUM("ECG", "NST"),
      allowNull: false
    },
    imageUrl: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false
    },
    imageKey: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false
    },
    uploadedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "lab_patient_images"
  }
);

module.exports = LabPatientImages;
