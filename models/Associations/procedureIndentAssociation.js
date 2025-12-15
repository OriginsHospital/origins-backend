const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const ProcedureIndentAssociationModel = MySqlConnection._instance.define(
  "procedureIndentAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    patientId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    visitId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    procedureId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "procedure_indent_associations"
  }
);

module.exports = ProcedureIndentAssociationModel;
