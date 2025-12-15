const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const UserModuleAssociationModel = MySqlConnection._instance.define(
  "userModuleAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    moduleId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    accessType: {
      type: Sequelize.STRING(1),
      allowNull: false
    }
  },
  {
    tableName: "user_module_associations"
  }
);

module.exports = UserModuleAssociationModel;
