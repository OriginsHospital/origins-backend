const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const InjectionListMasterModel = MySqlConnection._instance.define(
  "InjectionListMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    patientId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    administeredDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    administeredTime: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    medicationId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    dosage: {
        type: Sequelize.STRING(1000),
        allowNull: false
    },
    administeredNurseId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
  },
  {
    tableName: "injection_list_master"
  }
);

module.exports = InjectionListMasterModel;
