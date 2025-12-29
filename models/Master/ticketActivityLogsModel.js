const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TicketActivityLogsModel = MySqlConnection._instance.define(
  "TicketActivityLogs",
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
    activityType: {
      type: Sequelize.DataTypes.ENUM(
        "STATUS_CHANGE",
        "REASSIGNED",
        "PRIORITY_CHANGE",
        "COMMENT",
        "CREATED"
      ),
      allowNull: false,
      field: "activity_type"
    },
    oldValue: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true,
      field: "old_value"
    },
    newValue: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true,
      field: "new_value"
    },
    commentText: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true,
      field: "comment_text"
    },
    performedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      field: "performed_by"
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false,
      field: "created_at"
    }
  },
  {
    tableName: "ticket_activity_logs",
    timestamps: false,
    underscored: true
  }
);

module.exports = TicketActivityLogsModel;
