const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const consultationAppointmentLineBillsAssociations = MySqlConnection._instance.define(
  "consultationAppointmentLineBillsAssociations",
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
    billTypeId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    billTypeValue: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    prescribedQuantity: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    purchaseQuantity: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    returnQuantity: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    prescriptionDetails: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true
    },
    prescriptionDays: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    isSpouse: {
      type: Sequelize.DataTypes.TINYINT,
      allowNull: true
    },
    status: {
      type: Sequelize.DataTypes.STRING,
      allowNull: true
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "consultation_appointment_line_bills_associations"
  }
);

module.exports = consultationAppointmentLineBillsAssociations;
