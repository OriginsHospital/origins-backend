const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TasksModel = MySqlConnection._instance.define(
  "Tasks",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    taskCode: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: "task_code"
    },
    taskName: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false,
      field: "task_name"
    },
    description: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    pendingOn: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true,
      field: "pending_on"
    },
    remarks: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: Sequelize.DataTypes.ENUM(
        "Pending",
        "In Progress",
        "Completed",
        "Cancelled"
      ),
      allowNull: false,
      defaultValue: "Pending"
    },
    startDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true,
      field: "start_date"
    },
    endDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true,
      field: "end_date"
    },
    alertEnabled: {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "alert_enabled"
    },
    alertDate: {
      type: Sequelize.DataTypes.DATE,
      allowNull: true,
      field: "alert_date"
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      field: "created_by"
    },
    assignedTo: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
      field: "assigned_to"
    },
    department: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    category: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false,
      field: "created_at"
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false,
      field: "updated_at"
    }
  },
  {
    tableName: "tasks",
    timestamps: true,
    underscored: true
  }
);

module.exports = TasksModel;
