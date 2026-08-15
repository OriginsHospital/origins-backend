const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const ConsultationDoctorBranchAssociation = MySqlConnection._instance.define(
  "consultationDoctorBranchAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    doctorUserId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    branchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
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
      type: Sequelize.DataTypes.DATE
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE
    }
  },
  {
    tableName: "consultation_doctor_branch_association"
  }
);

module.exports = ConsultationDoctorBranchAssociation;
