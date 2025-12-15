const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const branchChangeRequestMasterModel = MySqlConnection._instance.define(
  "branchChangeRequestMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    branchData: {
      type: Sequelize.DataTypes.JSON,
      allowNull: false
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    requestStatus: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    requestedDate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    requestAcceptedDate: {
      type: Sequelize.DATE,
      allowNull: true
    }
  },
  {
    tableName: "branch_change_request"
  }
);

module.exports = branchChangeRequestMasterModel;
