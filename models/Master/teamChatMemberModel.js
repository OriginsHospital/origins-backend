const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TeamChatMemberModel = MySqlConnection._instance.define(
  "teamChatMember",
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
    userId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      }
    },
    role: {
      type: Sequelize.DataTypes.ENUM("admin", "member"),
      allowNull: false,
      defaultValue: "member"
    },
    joinedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    lastReadAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "team_chat_members",
    indexes: [
      {
        unique: true,
        fields: ["chatId", "userId"]
      }
    ]
  }
);

module.exports = TeamChatMemberModel;
