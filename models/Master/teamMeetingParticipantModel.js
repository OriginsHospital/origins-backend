const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TeamMeetingParticipantModel = MySqlConnection._instance.define(
  "teamMeetingParticipant",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    meetingId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "team_meetings",
        key: "id"
      }
    },
    userId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      }
    },
    status: {
      type: Sequelize.DataTypes.ENUM(
        "invited",
        "accepted",
        "declined",
        "attended",
        "absent"
      ),
      allowNull: false,
      defaultValue: "invited"
    },
    joinedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    },
    leftAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "team_meeting_participants",
    indexes: [
      {
        unique: true,
        fields: ["meetingId", "userId"]
      }
    ]
  }
);

module.exports = TeamMeetingParticipantModel;
