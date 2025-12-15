const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const AppointmentChargesBranchAssociation = MySqlConnection._instance.define(
  "AppointmentChargesBranchAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    appointmentCharges: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false,
    },
    branchId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    appointmentReasonId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
  },
  {
    tableName: "appointment_charges_branch_association"
  }
);

module.exports = AppointmentChargesBranchAssociation;
