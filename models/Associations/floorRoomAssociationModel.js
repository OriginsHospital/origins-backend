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
    type: {
      type: Sequelize.DataTypes.ENUM("AC", "Non-AC"),
      allowNull: false
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
