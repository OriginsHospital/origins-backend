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
