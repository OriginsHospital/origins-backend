const AWS = require("aws-sdk");

class AWSConnection {
  constructor() {
    this.configureAWS();
  }

  configureAWS() {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
  }

  getS3BucketName() {
    return process.env.S3_BUCKET_NAME;
  }

  getS3() {
    return new AWS.S3();
  }
}

module.exports = new AWSConnection();
