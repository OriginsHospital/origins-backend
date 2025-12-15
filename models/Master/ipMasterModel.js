const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const IpMasterModel = MySqlConnection._instance.define(
  "ipMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    branchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    patientId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    visitId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    procedureId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    dateOfAdmission: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: false
    },
    timeOfAdmission: {
      type: Sequelize.DataTypes.TIME,
      allowNull: false
    },
    bedId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    roomCode: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: false
    },
    packageAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null
    },
    dateOfDischarge: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null
    },
    isActive: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "ip_master"
  }
);

module.exports = IpMasterModel;
