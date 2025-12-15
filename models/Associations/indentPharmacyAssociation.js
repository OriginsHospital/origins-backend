const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const IndentPharmacyAssociationModel = MySqlConnection._instance.define(
  "indentPharmacyAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    indentId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    itemId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    prescribedQuantity: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    purchasedQuantity: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    },
    prescribedOn: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "indent_pharmacy_association"
  }
);

module.exports = IndentPharmacyAssociationModel;
