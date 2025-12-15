const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const RoleModuleAssociationModel = MySqlConnection._instance.define(
  "roleModuleAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    roleId: {
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
    tableName: "role_module_associations"
  }
);

module.exports = RoleModuleAssociationModel;
