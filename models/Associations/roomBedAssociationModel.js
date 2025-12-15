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
    charge: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    isBooked: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
