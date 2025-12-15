const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TreatmentPickUpSheetAssociations = MySqlConnection._instance.define(
  "TreatmentPickUpSheetAssociations",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    treatmentCycleId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    template: {
        type: Sequelize.TEXT,
        allowNull: false
    }
  },
  {
    tableName: "treatment_pickupsheet_associations"
  }
);

module.exports = TreatmentPickUpSheetAssociations;
