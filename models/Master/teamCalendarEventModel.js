const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TeamCalendarEventModel = MySqlConnection._instance.define(
  "teamCalendarEvent",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    title: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    eventType: {
      type: Sequelize.DataTypes.ENUM(
        "meeting",
        "task",
        "reminder",
        "shift",
        "appointment"
      ),
      allowNull: false,
      defaultValue: "meeting"
    },
    startTime: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    },
    location: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    priority: {
      type: Sequelize.DataTypes.ENUM("low", "medium", "high", "urgent"),
      allowNull: false,
      defaultValue: "medium"
    },
    color: {
      type: Sequelize.DataTypes.STRING(7),
      allowNull: true,
      defaultValue: "#1976d2"
    },
    isAllDay: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      }
    },
    updatedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      }
    }
  },
  {
    tableName: "team_calendar_events",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    indexes: [
      {
        fields: ["startTime", "endTime"]
      },
      {
        fields: ["eventType"]
      }
    ]
  }
);

module.exports = TeamCalendarEventModel;
