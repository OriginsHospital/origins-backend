const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const BloodGroupMaster = MySqlConnection._instance.define(
  "bloodGroupMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    bloodGroup: {
      type: Sequelize.DataTypes.STRING(10),
      allowNull: false,
      unique: true
    },
    isActive: {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE,
      defaultValue: Sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      ),
      allowNull: true
    }
  },
  {
    tableName: "blood_group_master"
  }
);

module.exports = BloodGroupMaster;
