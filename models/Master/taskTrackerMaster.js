const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TaskTrackerModel = MySqlConnection._instance.define(
  "TaskTracker",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    branchId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    departmentId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    assignedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    assignedTo: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    assignedDate: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    },
    dueDate: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    },
    description: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false
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
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    }
  },
  {
    tableName: "task_tracker"
  }
);

module.exports = TaskTrackerModel;
