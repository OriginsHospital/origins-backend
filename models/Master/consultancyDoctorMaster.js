const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const ConsultancyDoctorMasterModel = MySqlConnection._instance.define(
  "consultancyDoctorMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    userId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    name: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    shiftFrom: {
      type: Sequelize.DataTypes.TIME,
      allowNull: false
    },
    shiftTo: {
      type: Sequelize.DataTypes.TIME,
      allowNull: false
    }
  },
  {
    tableName: "consultation_doctor_master"
  }
);

module.exports = ConsultancyDoctorMasterModel;
