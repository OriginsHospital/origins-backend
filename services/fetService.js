const { QueryTypes, Op, Sequelize } = require("sequelize");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const { uploadFetSchema } = require("../schemas/fetSchema");
const AWSConnection = require("../connections/aws_connection");
const VisitFetConsentsAssociations = require("../models/Associations/visitFetConsentsAssociations");
const AppointmentPaymentService = require("../services/appointmentPaymentsService");
const VisitPackagesAssociation = require("../models/Associations/visitPackagesAssociation");
const PatientMasterModel = require("../models/Master/patientMaster");
const TriggerTimeStampsModel = require("../models/Master/triggerTimeStampsMaster");

class ConsentFormsTemplateService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.s3 = AWSConnection.getS3();
    this.bucketName = AWSConnection.getS3BucketName();
  }

  async getFetConsentsByVisitIdService() {
    const { visitId } = this._request.params;
    const getFetConsentsQuery = `select * from visit_fet_consents_associations where visitId = :visitId`;
    const getFetConsents = await this.mysqlConnection
      .query(getFetConsentsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          visitId: visitId
        }
      })
      .catch(err => {
        console.log("Error while getting FetConsents data", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return getFetConsents;
  }

  async uploadFetConsentsService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedData = await uploadFetSchema.validateAsync(
      this._request.body
    );
    validatedData.createdBy = createdByUserId;
    const packageData = await VisitPackagesAssociation.findOne({
      where: {
        visitId: validatedData.visitId
      }
    });

    if (!packageData || !packageData.registrationDate) {
      throw new createError.BadRequest("Package Amount still not defined");
    }

    if (!this._request.files && this._request.files.fetConsent) {
      throw new createError.BadRequest("Fet File is missing!");
    }

    return await this.mysqlConnection.transaction(async t => {
      const file = this._request.files.fetConsent[0];

      const uniqueFileName = `${Date.now()}_${file.originalname}`;
      const key = `patients/${validatedData.patientId}/fetConsents/${uniqueFileName}`;
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

      const createData = await VisitFetConsentsAssociations.create(
        paramsToSend,
        {
          transaction: t
        }
      ).catch(err => {
        console.log("Error while uploading Fet Consent", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return createData;
    });
  }

  async deleteFetConsentByVisitIdService() {
    const { id } = this._request.params;

    return await this.mysqlConnection.transaction(async t => {
      const getFetConsent = await VisitFetConsentsAssociations.findOne({
        where: { id: id },
        transaction: t
      }).catch(err => {
        console.log("Error while retrieving fetConsent data", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (!getFetConsent) {
        throw new createError.NotFound(`Consent form with id ${id} not found`);
      }

      await VisitFetConsentsAssociations.destroy({
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
        Key: getFetConsent.key
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

  async reviewFetConsentsService() {
    const { id } = this._request.params;
    this._request.body = {
      ...this._request.body,
      visitId: id,
      stage: "FET_START"
    };
    const appointmentPaymentServiceObj = new AppointmentPaymentService(
      this._request,
      this._response,
      this._next
    );
    return await appointmentPaymentServiceObj.updateTreatmentStatusService();
  }
}

module.exports = ConsentFormsTemplateService;
