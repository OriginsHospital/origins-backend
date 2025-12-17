const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TeamCallModel = MySqlConnection._instance.define(
  "teamCall",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    chatId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "team_chats",
        key: "id"
      }
    },
    callerId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      }
    },
    receiverId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      }
    },
    callType: {
      type: Sequelize.DataTypes.ENUM("voice", "video"),
      allowNull: false,
      defaultValue: "voice"
    },
    callStatus: {
      type: Sequelize.DataTypes.ENUM(
        "initiated",
        "ringing",
        "answered",
        "rejected",
        "missed",
        "ended",
        "failed"
      ),
      allowNull: false,
      defaultValue: "initiated"
    },
    startTime: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    endTime: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    },
    duration: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
      comment: "Duration in seconds"
    }
  },
  {
    tableName: "team_calls",
    indexes: [
      {
        fields: ["callerId", "createdAt"]
      },
      {
        fields: ["receiverId", "createdAt"]
      },
      {
        fields: ["callStatus"]
      }
    ]
  }
);

module.exports = TeamCallModel;
