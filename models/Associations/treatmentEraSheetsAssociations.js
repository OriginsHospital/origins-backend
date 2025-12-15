const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TreatmentEraSheetAssociations = MySqlConnection._instance.define(
  "treatmentEraSheetAssociations",
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
    template: {
      type: Sequelize.TEXT,
      allowNull: false
    }
  },
  {
    tableName: "treatment_erasheet_associations"
  }
);

module.exports = TreatmentEraSheetAssociations;
