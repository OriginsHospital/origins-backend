const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const PortalAccountModel = MySqlConnection._instance.define(
  "portalAccount",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    email: {
      type: Sequelize.DataTypes.STRING(150),
      allowNull: false,
      unique: true
    },
    password: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    accountType: {
      type: Sequelize.DataTypes.ENUM("super_admin", "patient"),
      allowNull: false
    },
    patientMasterId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
      unique: true
    },
    patientCode: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    fullName: {
      type: Sequelize.DataTypes.STRING(150),
      allowNull: false
    },
    mobileNo: {
      type: Sequelize.DataTypes.STRING(20),
      allowNull: true
    },
    isActive: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "portal_accounts",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt"
  }
);

module.exports = PortalAccountModel;
