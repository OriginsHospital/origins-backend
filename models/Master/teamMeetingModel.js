const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TeamMeetingModel = MySqlConnection._instance.define(
  "teamMeeting",
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
    startTime: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    },
    agenda: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    meetingType: {
      type: Sequelize.DataTypes.ENUM("scheduled", "instant", "recurring"),
      allowNull: false,
      defaultValue: "scheduled"
    },
    meetingLink: {
      type: Sequelize.DataTypes.STRING(500),
      allowNull: true
    },
    status: {
      type: Sequelize.DataTypes.ENUM(
        "scheduled",
        "ongoing",
        "completed",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "scheduled"
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
    tableName: "team_meetings",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    indexes: [
      {
        fields: ["startTime"]
      },
      {
        fields: ["status"]
      }
    ]
  }
);

module.exports = TeamMeetingModel;
