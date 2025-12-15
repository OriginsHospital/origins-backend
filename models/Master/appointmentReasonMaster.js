const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const AppointmentReasonMaster = MySqlConnection._instance.define(
  "appointmentReasonMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    isOther: {
      type: Sequelize.TINYINT,
      allowNull: false,
      default: 0
    },
    visit_type: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    isSpouse: {
      type: Sequelize.TINYINT,
      allowNull: false,
      default: 0
    },
    appointmentCharges: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: true
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "appointment_reason_master"
  }
);

module.exports = AppointmentReasonMaster;
