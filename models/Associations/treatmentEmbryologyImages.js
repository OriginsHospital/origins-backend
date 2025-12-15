const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const treatmentEmbryologyImages = MySqlConnection._instance.define(
  "treatmentEmbryologyImages",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    treatmentEmbryologyId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    imageUrl: {
      type: Sequelize.DataTypes.TEXT("long"),
      allowNull: false
    },
    imageKey: {
      type: Sequelize.DataTypes.TEXT("long"),
      allowNull: false
    },
    uploadedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "treatment_embryology_images"
  }
);

module.exports = treatmentEmbryologyImages;
