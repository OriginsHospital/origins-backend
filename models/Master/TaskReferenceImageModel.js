const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TaskReferenceImageModel = MySqlConnection._instance.define(
  "TaskReferenceImages",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    taskId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    imageUrl: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false
    },
    imageKey: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false
    },
    uploadedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "task_reference_images"
  }
);

module.exports = TaskReferenceImageModel;
