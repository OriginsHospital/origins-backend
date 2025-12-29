const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TicketCommentsModel = MySqlConnection._instance.define(
  "TicketComments",
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
    commentText: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false,
      field: "comment_text"
    },
    commentedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      field: "commented_by"
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false,
      field: "created_at"
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false,
      field: "updated_at"
    }
  },
  {
    tableName: "ticket_comments",
    timestamps: true,
    underscored: true
  }
);

module.exports = TicketCommentsModel;
