const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const PharmacyKitMaster = MySqlConnection._instance.define(
  "pharmacyKitMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    kitName: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    kitValue: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    medicines: {
      type: Sequelize.JSON,
      allowNull: false
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: 1
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "pharmacy_kit_master",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt"
  }
);

module.exports = PharmacyKitMaster;
