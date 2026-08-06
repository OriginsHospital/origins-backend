const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const UptResultsMaster = MySqlConnection._instance.define(
  "UptResultsMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    testDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: false
    },
    branchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    patientId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    cycleType: {
      type: Sequelize.DataTypes.ENUM("IVF", "OI-TI", "IUI"),
      allowNull: false
    },
    uptResult: {
      type: Sequelize.DataTypes.ENUM("Positive", "Negative"),
      allowNull: false
    },
    createdByNurseId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "upt_results"
  }
);

module.exports = UptResultsMaster;
