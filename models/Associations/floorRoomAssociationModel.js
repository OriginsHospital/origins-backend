const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const FloorRoomAssociationModel = MySqlConnection._instance.define(
  "floorRoomAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    floorId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: false
    },
    roomNumber: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: true
    },
    type: {
      type: Sequelize.DataTypes.ENUM("AC", "Non-AC"),
      allowNull: false
    },
    roomCategory: {
      type: Sequelize.DataTypes.ENUM(
        "General",
        "Semi-Private",
        "Private",
        "VIP"
      ),
      allowNull: true,
      defaultValue: "General"
    },
    genderRestriction: {
      type: Sequelize.DataTypes.ENUM("Male", "Female", "Any"),
      allowNull: true,
      defaultValue: "Any"
    },
    totalBeds: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    charges: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
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
    tableName: "floor_room_association"
  }
);

module.exports = FloorRoomAssociationModel;
