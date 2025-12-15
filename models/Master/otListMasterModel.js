const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const OTListMasterModel = MySqlConnection._instance.define(
  "OTListMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    branchId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    treatmentCycleId: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    patientName: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    procedureName: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    procedureDate: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    time: {
      type: Sequelize.STRING(100),
      allowNull: true
    },
    surgeonId: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    anesthetistId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    otStaff: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    embryologistId: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "ot_list_master"
  }
);

module.exports = OTListMasterModel;
