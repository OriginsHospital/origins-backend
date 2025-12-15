const Joi = require("@hapi/joi");

const uploadToS3BucketSchema = Joi.object({
  fileName: Joi.string()
    .max(100)
    .required()
});

module.exports = {
  uploadToS3BucketSchema
};
