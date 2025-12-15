const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const BuildingFloorAssociationModel = MySqlConnection._instance.define(
  "buildingFloorAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    buildingId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    floorNumber: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    floorType: {
      type: Sequelize.DataTypes.ENUM("IP", "ICU", "Mixed"),
      allowNull: true,
      defaultValue: "IP"
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
    tableName: "building_floor_association"
  }
);

module.exports = BuildingFloorAssociationModel;
