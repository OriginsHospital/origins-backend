const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TeamChatModel = MySqlConnection._instance.define(
  "teamChat",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    name: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    description: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    chatType: {
      type: Sequelize.DataTypes.ENUM("direct", "group"),
      allowNull: false,
      defaultValue: "direct"
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    updatedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "team_chats"
  }
);

module.exports = TeamChatModel;
