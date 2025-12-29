const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TicketTagsModel = MySqlConnection._instance.define(
  "TicketTags",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    ticketId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      field: "ticket_id"
    },
    tagName: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: false,
      field: "tag_name"
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false,
      field: "created_at"
    }
  },
  {
    tableName: "ticket_tags",
    timestamps: false,
    underscored: true
  }
);

module.exports = TicketTagsModel;
