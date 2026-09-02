const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TreatmentFetSheetAssociations = MySqlConnection._instance.define(
  "treatmentFetSheetAssociations",
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
    cycleNumber: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    template: {
      type: Sequelize.TEXT,
      allowNull: false
    }
  },
  {
    tableName: "treatment_fetsheet_associations"
  }
);

module.exports = TreatmentFetSheetAssociations;
