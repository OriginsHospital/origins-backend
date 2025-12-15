const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const IpNotesAssociationsModel = MySqlConnection._instance.define(
  "ipNotesAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    ipId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    notes: {
      type: Sequelize.DataTypes.TEXT("long"),
      allowNull: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "ip_notes_associations"
  }
);

module.exports = IpNotesAssociationsModel;
