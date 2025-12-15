const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const TreatmentTypeMaster = MySqlConnection._instance.define(
  "treatmentTypesMaster",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    isPackageExists: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
	isConsentsExists: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    follicularSheetExists: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
  },
  {
    tableName: "treatment_type_master"
  }
);

module.exports = TreatmentTypeMaster;
