const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const { Sequelize } = require("sequelize");
const lodash = require("lodash");
const {
  hospitalLogoInformationQuery,
  hospitalLogoInformationQueryForTreatmentOrder,
  hospitalLogoInformationUsingPatientIdQuery
} = require("../queries/base_queries");
const { hospitalLogoTemplate } = require("../templates/headerTemplates");
const {
  hopsitalLogoTemplateForInvoice
} = require("../templates/headerTemplates");
const AWSConnection = require("../connections/aws_connection");
const { uploadToS3BucketSchema } = require("../schemas/baseSchema");
const S3BucketUploadsMasterModel = require("../models/Master/S3BucketUploadsMasterModel");
class BaseService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.s3 = AWSConnection.getS3();
    this.bucketName = AWSConnection.getS3BucketName();
  }

  // Generate the header logo template based on appointment details: branch info different
  async hospitalLogoHeaderTemplate(appointmentId, type, id = null) {
    let data = null;
    if (appointmentId == null) {
      // It is a treatment milestone order. So get header information from Visit Id
      data = await this.mysqlConnection
        .query(hospitalLogoInformationQueryForTreatmentOrder, {
          replacements: {
            id: id,
            type: type
          },
          type: Sequelize.QueryTypes.SELECT
        })
        .catch(err => {
          console.log("Error while fetching header logo information", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    } else {
      data = await this.mysqlConnection
        .query(hospitalLogoInformationQuery, {
          replacements: {
            appointmentId: appointmentId,
            type: type
          },
          type: Sequelize.QueryTypes.SELECT
        })
        .catch(err => {
          console.log("Error while fetching header logo information", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    }

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.APPOINTMENT_NOT_FOUND);
    }

    let logoHeaderTemplate = hospitalLogoTemplate;
    logoHeaderTemplate = logoHeaderTemplate
      .replaceAll("{branchName}", data[0]?.logoInformation?.branchName)
      .replaceAll("{branchAddress}", data[0]?.logoInformation?.branchAddress)
      .replaceAll("{logoText}", data[0]?.logoInformation?.logoText)
      .replaceAll(
        "{branchPhoneNumber}",
        data[0]?.logoInformation?.branchPhoneNumber
      );

    return logoHeaderTemplate;
  }

  // Different function - A5 Size header
  async hospitalLogoHeaderTemplateForInvoice(appointmentId, type, id = null) {
    let data = null;
    if (appointmentId == null) {
      // It is a treatment milestone order. So get header information from Visit Id
      data = await this.mysqlConnection
        .query(hospitalLogoInformationQueryForTreatmentOrder, {
          replacements: {
            id: id,
            type: type
          },
          type: Sequelize.QueryTypes.SELECT
        })
        .catch(err => {
          console.log("Error while fetching header logo information", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    } else {
      data = await this.mysqlConnection
        .query(hospitalLogoInformationQuery, {
          replacements: {
            appointmentId: appointmentId,
            type: type
          },
          type: Sequelize.QueryTypes.SELECT
        })
        .catch(err => {
          console.log("Error while fetching header logo information", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    }

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.APPOINTMENT_NOT_FOUND);
    }

    let logoHeaderTemplate = hopsitalLogoTemplateForInvoice;
    logoHeaderTemplate = logoHeaderTemplate
      .replaceAll("{branchName}", data[0]?.logoInformation?.branchName)
      .replaceAll("{branchAddress}", data[0]?.logoInformation?.branchAddress)
      .replaceAll("{logoText}", data[0]?.logoInformation?.logoText)
      .replaceAll(
        "{branchPhoneNumber}",
        data[0]?.logoInformation?.branchPhoneNumber
      );

    return logoHeaderTemplate;
  }

  // Hospital logo Information Using PatientId
  async hospitalLogoHeaderTemplateUsingPatientId(patientId) {
    let data = await this.mysqlConnection
      .query(hospitalLogoInformationUsingPatientIdQuery, {
        replacements: {
          patientId: patientId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log(
          "Error while fetching header logo information using patientId",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    let logoHeaderTemplate = hospitalLogoTemplate;
    logoHeaderTemplate = logoHeaderTemplate
      .replaceAll("{branchName}", data[0]?.logoInformation?.branchName)
      .replaceAll("{branchAddress}", data[0]?.logoInformation?.branchAddress)
      .replaceAll("{logoText}", data[0]?.logoInformation?.logoText)
      .replaceAll(
        "{branchPhoneNumber}",
        data[0]?.logoInformation?.branchPhoneNumber
      );

    return logoHeaderTemplate;
  }

  // Functions for sending Emails, Messages etc.TODO

  async uploadToS3BucketRouteService() {
    const validatedPayload = await uploadToS3BucketSchema.validateAsync(
      this._request.body
    );

    const { fileName } = validatedPayload;

    if (!this._request.files || !this._request.files?.fileToUpload) {
      throw new createError.BadRequest("File is required to upload!");
    }

    return await this.mysqlConnection.transaction(async t => {
      const file = this._request.files.fileToUpload[0];

      const uniqueFileName = `${fileName}_${Date.now()}`;
      const key = `base/uploads/${uniqueFileName}`;
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      };

      const uploadResult = await this.s3.upload(uploadParams).promise();
      const ImageURL = uploadResult.Location;

      const paramsToSend = {
        fileName,
        fileUrl: ImageURL
      };

      await S3BucketUploadsMasterModel.create(paramsToSend, {
        transaction: t
      }).catch(err => {
        console.log(
          "Error while uploading data to s3 bucket table",
          err.message
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return paramsToSend;
    });
  }
}

module.exports = BaseService;
