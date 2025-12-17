const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TeamMessageModel = MySqlConnection._instance.define(
  "teamMessage",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    chatId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "team_chats",
        key: "id"
      }
    },
    senderId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      }
    },
    message: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    messageType: {
      type: Sequelize.DataTypes.ENUM("text", "file", "image", "video", "audio"),
      allowNull: false,
      defaultValue: "text"
    },
    fileUrl: {
      type: Sequelize.DataTypes.STRING(500),
      allowNull: true
    },
    fileName: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    fileSize: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    replyToMessageId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "team_messages",
        key: "id"
      }
    },
    mentions: {
      type: Sequelize.DataTypes.JSON,
      allowNull: true
    },
    isEdited: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isDeleted: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    deletedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "team_messages",
    indexes: [
      {
        fields: ["chatId", "createdAt"]
      },
      {
        fields: ["senderId"]
      }
    ]
  }
);

module.exports = TeamMessageModel;
