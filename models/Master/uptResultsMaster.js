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
    resultDate: {
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
      type: Sequelize.DataTypes.STRING(150),
      allowNull: false
    },
    uptResult: {
      type: Sequelize.DataTypes.ENUM("Positive", "Negative"),
      allowNull: false
    },
    createdByNurseId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "upt_results"
  }
);

module.exports = UptResultsMaster;
