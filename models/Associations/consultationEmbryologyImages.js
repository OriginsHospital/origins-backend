const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const consultationEmbryologyImages = MySqlConnection._instance.define(
  "consultationEmbryologyImages",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    consultationEmbryologyId: {
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
    tableName: "consultation_embryology_images"
  }
);

module.exports = consultationEmbryologyImages;
