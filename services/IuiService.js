const { QueryTypes, Op, Sequelize } = require("sequelize");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const AWSConnection = require("../connections/aws_connection");
const { uploadIuiSchema } = require("../schemas/iuiSchema");
const VisitIuiConsentsAssociations = require("../models/Associations/VisitIuiConsentsAssociations");

class IUIService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.s3 = AWSConnection.getS3();
    this.bucketName = AWSConnection.getS3BucketName();
  }

  async getIuiConsentsByVisitIdService() {
    const { visitId } = this._request.params;
    const getIuiConsentsQuery = `select * from visit_iui_consents_associations where visitId = :visitId`;
    const getIuiConsents = await this.mysqlConnection
      .query(getIuiConsentsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          visitId: visitId
        }
      })
      .catch(err => {
        console.log("Error while getting IuiConsents data", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return getIuiConsents;
  }

  async uploadIuiConsentService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedData = await uploadIuiSchema.validateAsync(
      this._request.body
    );
    validatedData.createdBy = createdByUserId;
    // const packageData = await VisitPackagesAssociation.findOne({
    //   where: {
    //     visitId: validatedData.visitId
    //   }
    // });

    // if (!packageData || !packageData.registrationDate) {
    //   throw new createError.BadRequest("Package Amount still not defined");
    // }

    if (!this._request.files && this._request.files.iuiConsent) {
      throw new createError.BadRequest("iuiConsent File is missing!");
    }

    return await this.mysqlConnection.transaction(async t => {
      const file = this._request.files.iuiConsent[0];

      const uniqueFileName = `${Date.now()}_${file.originalname}`;
      const key = `patients/${validatedData.patientId}/iuiConsents/${uniqueFileName}`;
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      };

      const uploadResult = await this.s3.upload(uploadParams).promise();
      const ImageURL = uploadResult.Location;

      const paramsToSend = {
        visitId: validatedData.visitId,
        createdBy: validatedData.createdBy,
        key: key,
        link: ImageURL
      };

      const createData = await VisitIuiConsentsAssociations.create(
        paramsToSend,
        {
          transaction: t
        }
      ).catch(err => {
        console.log("Error while uploading Iui Consent", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return createData;
    });
  }

  async deleteIuiConsentByVisitIdService() {
    const { id } = this._request.params;

    return await this.mysqlConnection.transaction(async t => {
      const getIuiConsent = await VisitIuiConsentsAssociations.findOne({
        where: { id: id },
        transaction: t
      }).catch(err => {
        console.log("Error while retrieving IuiConsent data", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (!getIuiConsent) {
        throw new createError.NotFound(`Consent form with id ${id} not found`);
      }

      await VisitIuiConsentsAssociations.destroy({
        where: { id: id },
        transaction: t
      }).catch(err => {
        console.log("Error while deleting database record", err.message);
        throw new createError.InternalServerError(
          "Failed to delete record from database"
        );
      });

      const deleteParams = {
        Bucket: this.bucketName,
        Key: getIuiConsent.key
      };

      try {
        await this.s3.deleteObject(deleteParams).promise();
        console.log(
          `Deleted S3 file for consent form with id ${id} successfully.`
        );
      } catch (err) {
        console.log("Error while deleting file from S3", err.message);
        throw new createError.InternalServerError(
          "Failed to delete file from S3 after database deletion"
        );
      }

      return `consent form with id ${id} ${Constants.DELETED_SUCCESSFULLY}`;
    });
  }
}

module.exports = IUIService;
