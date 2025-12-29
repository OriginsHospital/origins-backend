const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TicketsModel = MySqlConnection._instance.define(
  "Tickets",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    ticketCode: {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "ticket_code"
    },
    taskDescription: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false,
      field: "task_description"
    },
    assignedTo: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      field: "assigned_to"
    },
    priority: {
      type: Sequelize.DataTypes.ENUM("LOW", "MEDIUM", "HIGH"),
      allowNull: false,
      defaultValue: "MEDIUM"
    },
    status: {
      type: Sequelize.DataTypes.ENUM("OPEN", "IN_PROGRESS", "COMPLETED"),
      allowNull: false,
      defaultValue: "OPEN"
    },
    category: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      field: "created_by"
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
    tableName: "tickets",
    timestamps: true,
    underscored: true
  }
);

module.exports = TicketsModel;
