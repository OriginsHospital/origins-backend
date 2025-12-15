const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const VisitHysteroscopyReferenceImages = MySqlConnection._instance.define(
  "VisitHysteroscopyReferenceImages",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    hysteroscopyId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    imageUrl: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false
    },
    imageKey: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false
    },
    uploadedBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "visit_hysteroscopy_reference_images"
  }
);

module.exports = VisitHysteroscopyReferenceImages;
