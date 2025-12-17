const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TeamScheduleModel = MySqlConnection._instance.define(
  "teamSchedule",
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
    scheduleType: {
      type: Sequelize.DataTypes.ENUM("shift", "task", "rotation"),
      allowNull: false,
      defaultValue: "shift"
    },
    startTime: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    },
    assignedTo: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      }
    },
    departmentId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    priority: {
      type: Sequelize.DataTypes.ENUM("low", "medium", "high", "urgent"),
      allowNull: false,
      defaultValue: "medium"
    },
    status: {
      type: Sequelize.DataTypes.ENUM(
        "pending",
        "in-progress",
        "completed",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "pending"
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
    tableName: "team_schedules",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    indexes: [
      {
        fields: ["startTime", "endTime"]
      },
      {
        fields: ["assignedTo"]
      },
      {
        fields: ["scheduleType"]
      }
    ]
  }
);

module.exports = TeamScheduleModel;
