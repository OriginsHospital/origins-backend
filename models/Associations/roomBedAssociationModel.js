const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const RoomBedAssociationModel = MySqlConnection._instance.define(
  "roomBedAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    roomId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: false
    },
    bedNumber: {
      type: Sequelize.DataTypes.STRING(20),
      allowNull: true
    },
    bedType: {
      type: Sequelize.DataTypes.ENUM("Normal", "ICU"),
      allowNull: true,
      defaultValue: "Normal"
    },
    hasOxygen: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    hasVentilator: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    charge: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: Sequelize.DataTypes.ENUM(
        "Available",
        "Occupied",
        "Reserved",
        "Maintenance"
      ),
      allowNull: false,
      defaultValue: "Available"
    },
    isBooked: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: "room_bed_association"
  }
);

module.exports = RoomBedAssociationModel;
