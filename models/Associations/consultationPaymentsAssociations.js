const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const consultationPaymentsAssociations = MySqlConnection._instance.define(
  "consultationPaymentsAssociations",
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
    billType: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    totalAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      defaultValue: null
    },
    totalAmountPaid: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      defaultValue: null
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "consultation_payments_associations"
  }
);

module.exports = consultationPaymentsAssociations;
