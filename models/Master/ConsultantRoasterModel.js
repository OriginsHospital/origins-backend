const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const ConsultantRoasterModel = MySqlConnection._instance.define(
  "ConsultantRoasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    branchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    consultantTypeId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    priority: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true,
      defaultValue: "LOW"
    },
    consultantName: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    contactNumber: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: true
    },
    workAddress: {
      type: Sequelize.DataTypes.TEXT("long"),
      allowNull: true
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "consultant_roaster",
    timestamps: false
  }
);

module.exports = ConsultantRoasterModel;
