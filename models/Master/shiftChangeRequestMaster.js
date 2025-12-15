const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const ShiftChangeRequestMasterModel = MySqlConnection._instance.define(
  "shiftChangeRequestMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    shiftFrom: {
      type: Sequelize.DataTypes.TIME,
      allowNull: false
    },
    shiftTo: {
      type: Sequelize.DataTypes.TIME,
      allowNull: false
    },
    doctorId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    requestStatus: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    requestedDate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    requestAcceptedDate: {
      type: Sequelize.DATE,
      allowNull: true
    }
  },
  {
    tableName: "shift_change_request"
  }
);

module.exports = ShiftChangeRequestMasterModel;
