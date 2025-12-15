const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const S3BucketUploadsMasterModel = MySqlConnection._instance.define(
  "S3BucketUploadsMasterModel",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    fileName: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    fileUrl: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    tableName: "s3_bucket_uploads_master"
  }
);

module.exports = S3BucketUploadsMasterModel;
