const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const OTPersonMasterModel = MySqlConnection._instance.define(
  "otPersonMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    personName: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    phoneNumber: {
      type: Sequelize.STRING(20),
      allowNull: false
    },
    designationId: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "ot_person_master"
  }
);

module.exports = OTPersonMasterModel;
