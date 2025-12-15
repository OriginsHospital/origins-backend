const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TaskCommentsModel = MySqlConnection._instance.define(
  "TaskComments",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    taskId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    commentedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    commentText: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    }
  },
  {
    tableName: "task_comments"
  }
);

module.exports = TaskCommentsModel;
