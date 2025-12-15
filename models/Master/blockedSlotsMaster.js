const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const BlockSlotsMasterModel = MySqlConnection._instance.define(
  "blockedSlotsMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    doctorId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    blockedDate: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    timeStart: {
      type: Sequelize.TIME,
      allowNull: false
    },
    timeEnd: {
      type: Sequelize.TIME,
      allowNull: false
    },
    blockType: {
      type: Sequelize.STRING(1),
      allowNull: false,
      default: "B"
    }
  },
  {
    tableName: "blocked_slots_master"
  }
);

module.exports = BlockSlotsMasterModel;
