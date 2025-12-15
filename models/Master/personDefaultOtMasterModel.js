const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const OTPersonDefaultMaster = MySqlConnection._instance.define(
  "otPersonDefaultMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    personId: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    designationId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    branchId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "ot_person_default_master"
  }
);

module.exports = OTPersonDefaultMaster;
