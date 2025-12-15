const { QueryTypes, Op, Sequelize } = require("sequelize");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const {
  uploadIcsiSchema,
  triggerSchema,
  uploadEraSchema
} = require("../schemas/icsiSchema");
const AWSConnection = require("../connections/aws_connection");
const VisitIcsiConsentsAssociations = require("../models/Associations/VisitIcsiConsentsAssociations");
const AppointmentPaymentService = require("../services/appointmentPaymentsService");
const VisitPackagesAssociation = require("../models/Associations/visitPackagesAssociation");
const OTListMasterModel = require("../models/Master/otListMasterModel");
const PatientMasterModel = require("../models/Master/patientMaster");
const TriggerTimeStampsModel = require("../models/Master/triggerTimeStampsMaster");
const VisitEraConsentsAssociations = require("../models/Associations/visitEraConsentsAssociations");

class ConsentFormsTemplateService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.s3 = AWSConnection.getS3();
    this.bucketName = AWSConnection.getS3BucketName();
  }

  async getIcsiConsentsByVisitIdService() {
    const { visitId } = this._request.params;
    const getIcsiConsentsQuery = `select * from visit_icsi_consents_associations where visitId = :visitId`;
    const getIcsiConsents = await this.mysqlConnection
      .query(getIcsiConsentsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          visitId: visitId
        }
      })
      .catch(err => {
        console.log("Error while getting IcsiConsents data", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return getIcsiConsents;
  }

  async uploadIcsiConsentService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedData = await uploadIcsiSchema.validateAsync(
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

    if (!this._request.files && this._request.files.icsiConsent) {
      throw new createError.BadRequest("icsiConsent File is missing!");
    }

    return await this.mysqlConnection.transaction(async t => {
      const file = this._request.files.icsiConsent[0];

      const uniqueFileName = `${Date.now()}_${file.originalname}`;
      const key = `patients/${validatedData.patientId}/icsiConsents/${uniqueFileName}`;
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

      const createData = await VisitIcsiConsentsAssociations.create(
        paramsToSend,
        {
          transaction: t
        }
      ).catch(err => {
        console.log("Error while uploading Icsi Consent", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return createData;
    });
  }

  async deleteIcsiConsentByVisitIdService() {
    const { id } = this._request.params;

    return await this.mysqlConnection.transaction(async t => {
      const getIcsiConsent = await VisitIcsiConsentsAssociations.findOne({
        where: { id: id },
        transaction: t
      }).catch(err => {
        console.log("Error while retrieving IcsiConsent data", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (!getIcsiConsent) {
        throw new createError.NotFound(`Consent form with id ${id} not found`);
      }

      await VisitIcsiConsentsAssociations.destroy({
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
        Key: getIcsiConsent.key
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

  async reviewIcsiConsentsService() {
    const { id } = this._request.params;
    this._request.body = {
      ...this._request.body,
      visitId: id,
      stage: "ICSI_START"
    };
    const appointmentPaymentServiceObj = new AppointmentPaymentService(
      this._request,
      this._response,
      this._next
    );
    return await appointmentPaymentServiceObj.updateTreatmentStatusService();
  }

  //not using from here as we shifted it to appointmentPaymentsService service and old for OTLIST changes
  async startTriggerService() {
    const ValidatedTriggerData = await triggerSchema.validateAsync(
      this._request.body
    );

    const existingTrigger = await TriggerTimeStampsModel.findOne({
      where: {
        visitId: ValidatedTriggerData.visitId,
        [Op.or]: [
          { triggerStartDate: { [Op.ne]: null } },
          { triggerStartedBy: { [Op.ne]: null } }
        ]
      }
    });

    if (existingTrigger) {
      throw new createError.BadRequest(
        "Trigger already started. Cannot perform this operation."
      );
    }

    // capture time and store in TriggerTimeStampsModel and schedule to create a OT Record after 35th hour
    return await this.mysqlConnection.transaction(async t => {
      const createdBy = this._request.userDetails?.id;
      const currentUserBranchId = this._request.userDetails.branchDetails.map(
        branch => branch.id
      );

      const currentTimestamp = new Date();
      const hours = 35;

      // Calculate the 35th hour timestamp
      const futureTimestamp = new Date(
        currentTimestamp.getTime() + hours * 60 * 60 * 1000
      );
      const procedureDate = futureTimestamp.toISOString().split("T")[0]; // 'YYYY-MM-DD'
      const procedureTime = futureTimestamp.toTimeString().slice(0, 5); // 'HH:mm'

      await TriggerTimeStampsModel.create(
        {
          visitId: ValidatedTriggerData.visitId,
          triggerStartDate: currentTimestamp,
          triggerStartedBy: createdBy
        },
        { transaction: t }
      ).catch(err => {
        console.log(
          "Error while updating trigger timestamps in Icsi",
          err.message
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      const patientInfo = await PatientMasterModel.findOne({
        where: {
          id: ValidatedTriggerData.patientId
        }
      });

      if (!patientInfo) {
        throw new createError.NotFound("Patient information not found.");
      }

      // Schedule the OT Record creation after 35 hours
      const createOTRecord = async () => {
        const createOTParams = {
          branchId: currentUserBranchId,
          patientName: `${patientInfo.firstName} ${patientInfo.lastName}`,
          procedureName: "OPU",
          procedureDate: procedureDate,
          time: procedureTime,
          surgeonId: "1",
          anesthetistId: 9,
          otStaff: "7",
          embryologistId: 5
        };

        await OTListMasterModel.create(createOTParams, {
          transaction: t
        }).catch(err => {
          console.log("Error while saving the details of OT master", err);
          throw new createError();
        });
      };

      setTimeout(createOTRecord, hours * 60 * 60 * 1000);

      return Constants.TRIGGER_STARTED_SUCCESSFULLY;
    });
  }

  async getEraConsentsByVisitIdService() {
    const { visitId } = this._request.params;
    const getEraConsentsQuery = `select * from visit_era_consents_associations where visitId = :visitId`;
    const getEraConsents = await this.mysqlConnection
      .query(getEraConsentsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          visitId: visitId
        }
      })
      .catch(err => {
        console.log("Error while getting EraConsents data", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return getEraConsents;
  }

  async uploadEraConsentsService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedData = await uploadEraSchema.validateAsync(
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

    if (!this._request.files && this._request.files.eraConsent) {
      throw new createError.BadRequest("Era File is missing!");
    }

    return await this.mysqlConnection.transaction(async t => {
      const file = this._request.files.eraConsent[0];

      const uniqueFileName = `${Date.now()}_${file.originalname}`;
      const key = `patients/${validatedData.patientId}/eraConsents/${uniqueFileName}`;
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

      const createData = await VisitEraConsentsAssociations.create(
        paramsToSend,
        {
          transaction: t
        }
      ).catch(err => {
        console.log("Error while uploading Era Consent", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return createData;
    });
  }

  async deleteEraConsentByVisitIdService() {
    const { id } = this._request.params;

    return await this.mysqlConnection.transaction(async t => {
      const getEraConsent = await VisitEraConsentsAssociations.findOne({
        where: { id: id },
        transaction: t
      }).catch(err => {
        console.log("Error while retrieving eraConsent data", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (!getEraConsent) {
        throw new createError.NotFound(`Consent form with id ${id} not found`);
      }

      await VisitEraConsentsAssociations.destroy({
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
        Key: getEraConsent.key
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

  async reviewEraConsentsService() {
    const { id } = this._request.params;
    this._request.body = {
      ...this._request.body,
      visitId: id,
      stage: "ERA_START"
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
