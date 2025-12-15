const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const EmbryologyTreatmentCycleAssociationModel = MySqlConnection._instance.define(
  "EmbryologyTreatmentCycleAssociationModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    treatmentCycleId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    categoryType: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    imageLink: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    template: {
        type: Sequelize.TEXT,
        allowNull: false
    }
  },
  {
    tableName: "treatement_embryology_association"
  }
);

module.exports = EmbryologyTreatmentCycleAssociationModel;
