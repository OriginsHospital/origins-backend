const lodash = require("lodash");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const {
  getScansByDateQuery,
  getFormFTemplateByDateRangeQuery,
  getScanHeaderInformation
} = require("../queries/scan_queries");
const { Sequelize } = require("sequelize");
const ScanTemplatesMaster = require("../models/Master/ScanTemplatesMaster");
const {
  saveScanResultSchema,
  uploadFormFForScanSchema,
  deleteFormFForScanSchema
} = require("../schemas/scanSchema");
const ScanResultModel = require("../models/Master/ScanResultMaster");
const patientScanFormFAssociations = require("../models/Associations/patientScanFormFAssociation");
const AWSConnection = require("../connections/aws_connection");
const { getPatientInfoForTemplate } = require("../queries/lab_queries");
const PatientScanFormFAssociation = require("../models/Associations/patientScanFormFAssociation");
const { scanHeaderTemplate } = require("../templates/headerTemplates");
const BaseService = require("./baseService");

const puppeteer = require("puppeteer");

class ScanService extends BaseService {
  constructor(request, response, next) {
    super(request, response, next);
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.s3 = AWSConnection.getS3();
    this.bucketName = AWSConnection.getS3BucketName();
  }

  async getScansByDateService() {
    const { appointmentDate } = this._request.params;
    const { branchId } = this._request.query;
    if (lodash.isEmpty(appointmentDate.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "appointmentDate")
      );
    }
    const data = await this.mysqlConnection
      .query(getScansByDateQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          appointmentDate: appointmentDate,
          branchId: branchId || null
        }
      })
      .catch(err => {
        console.log("Error while getting lab test fields", err);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async scanHeaderInformation(appointmentId, type, scanId) {
    const scanHeaderInformation = await this.mysqlConnection
      .query(getScanHeaderInformation, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          type: type.toLowerCase(),
          appointmentId: appointmentId,
          scanId: scanId
        }
      })
      .catch(err => {
        console.log("Error while getting the scan header information", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    let headerTemplate = scanHeaderTemplate;
    if (!lodash.isEmpty(scanHeaderInformation)) {
      headerTemplate = headerTemplate
        .replaceAll("{age}", scanHeaderInformation[0]?.patientInformation?.age)
        .replaceAll(
          "{doctorName}",
          scanHeaderInformation[0]?.patientInformation?.doctorName
        )
        .replaceAll(
          "{patientName}",
          scanHeaderInformation[0]?.patientInformation?.patientName
        )
        .replaceAll(
          "{gender}",
          scanHeaderInformation[0]?.patientInformation?.gender
        )
        .replaceAll(
          "{requestDateTime}",
          scanHeaderInformation[0]?.patientInformation?.requestDateTime
        )
        .replaceAll(
          "{printDate}",
          scanHeaderInformation[0]?.patientInformation?.printDate
        )
        .replaceAll(
          "{patientId}",
          scanHeaderInformation[0]?.patientInformation?.patientId
        )
        .replaceAll(
          "{mobileNumber}",
          scanHeaderInformation[0]?.patientInformation?.mobileNumber
        );
    } else {
      headerTemplate = headerTemplate
        .replaceAll("{age}", "")
        .replaceAll("{doctorName}", "")
        .replaceAll("{patientName}", "")
        .replaceAll("{gender}", "")
        .replaceAll("{requestDateTime}", "")
        .replaceAll("{printDate}", "")
        .replaceAll("{patientId}", "")
        .replaceAll("{mobileNumber}", "");
    }
    return headerTemplate;
  }

  async getScanTemplateByIdService() {
    const { id } = this._request.params;
    if (lodash.isEmpty(id.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "scan id")
      );
    }

    const { appointmentId, type } = this._request.query;
    if (lodash.isEmpty(appointmentId)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "appointmentId")
      );
    }
    if (lodash.isEmpty(type)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "type")
      );
    }

    let headerInformation = await this.scanHeaderInformation(
      appointmentId,
      type,
      id
    );

    let data = await ScanTemplatesMaster.findOne({
      where: {
        scanId: id
      },
      attributes: ["scanId", "scanTemplate"]
    }).catch(err => {
      console.log("Error while getting the scan template", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    data.scanTemplate = data.scanTemplate?.replaceAll(
      "{headerInformation}",
      headerInformation
    );

    // Adding Logo Header Information
    const hospitalLogoHeaderTemplate = await this.hospitalLogoHeaderTemplate(
      appointmentId,
      type
    );
    data.scanTemplate = data.scanTemplate?.replaceAll(
      "{hospitalLogoInformation}",
      hospitalLogoHeaderTemplate
    );

    return data;
  }

  async saveScanResultService() {
    let saveScanPayload = await saveScanResultSchema.validateAsync(
      this._request.body
    );
    let {
      appointmentId,
      type,
      scanId,
      scanResult,
      scanTestStatus
    } = saveScanPayload;

    let dataToPush = [];
    // NOT IN USE DIRECT WE ARE USING 2 (No Collect Stage)
    if (scanTestStatus == 1) {
      scanResult = await ScanTemplatesMaster.findOne({
        where: {
          scanId: scanId
        }
      }).catch(err => {
        console.log("Error while getting the scan template", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (lodash.isEmpty(scanResult)) {
        throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
      }
      scanResult = scanResult.scanTemplate;
    }

    dataToPush.push({
      appointmentId,
      type,
      scanId,
      scanResult,
      scanTestStatus
    });

    return await this.mysqlConnection.transaction(async t => {
      await ScanResultModel.destroy({
        where: {
          appointmentId: appointmentId,
          scanId: scanId,
          type: type
        },
        transaction: t
      }).catch(err => {
        console.log("Error while destroying the data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await ScanResultModel.bulkCreate(dataToPush, { transaction: t }).catch(
        err => {
          console.log("Error while pushing scan result", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        }
      );

      return ScanResultModel.findOne({
        where: {
          appointmentId: appointmentId,
          scanId: scanId,
          type: type
        },
        transaction: t
      });
    });
  }

  async getSavedScanResultService() {
    const { type, appointmentId, scanId } = this._request.query;
    try {
      const getSavedScanResult = await ScanResultModel.findOne({
        where: {
          appointmentId: appointmentId,
          type: type,
          scanId: scanId
        }
      });

      return getSavedScanResult;
    } catch (error) {
      console.error(
        "Error while fetching saved scan test values:",
        error.message
      );
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async uploadFormFForScansService() {
    const validatedData = await uploadFormFForScanSchema.validateAsync(
      this._request.body
    );
    if (!this._request.files || !this._request.files.formF) {
      throw new createError.BadRequest("formF File is missing!");
    }

    const { appointmentId, type, scanId } = validatedData;
    const patientScanFormFExists = await patientScanFormFAssociations.findOne({
      where: {
        appointmentId: appointmentId,
        type: type,
        scanId: scanId
      }
    });

    if (!patientScanFormFExists) {
      throw new createError.BadRequest(
        "Payment for respective scan is not completed"
      );
    }

    const patientInfo = await this.mysqlConnection
      .query(getPatientInfoForTemplate, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          type: type.toLowerCase(),
          appointmentId: appointmentId
        }
      })
      .catch(err => {
        console.log("Error while fetching patient Info", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(patientInfo)) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    return await this.mysqlConnection.transaction(async t => {
      const file = this._request.files.formF[0];

      const uniqueFileName = `${Date.now()}_${file.originalname}`;
      const key = `patients/${patientInfo[0].patientId}/formF/${appointmentId}/${scanId}/${uniqueFileName}`;
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      };

      const uploadResult = await this.s3.upload(uploadParams).promise();
      const ImageURL = uploadResult.Location;

      const paramsToSend = {
        formFUploadKey: key,
        formFUploadLink: ImageURL
      };

      const updatedData = await patientScanFormFAssociations
        .update(paramsToSend, {
          where: {
            appointmentId: appointmentId,
            type: type,
            scanId: scanId
          },
          transaction: t
        })
        .catch(err => {
          console.log("Error while uploading Scan FormF", err.message);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      const getPatientScanFormF = await patientScanFormFAssociations.findOne({
        where: {
          appointmentId: appointmentId,
          type: type,
          scanId: scanId
        }
      });

      return getPatientScanFormF;
    });
  }

  async deleteFormFForScansService() {
    const deleteFormFValidatedData = await deleteFormFForScanSchema.validateAsync(
      this._request.body
    );
    const { appointmentId, type, scanId } = deleteFormFValidatedData;
    return await this.mysqlConnection.transaction(async t => {
      const patientScanFormFExists = await patientScanFormFAssociations
        .findOne({
          where: {
            appointmentId: appointmentId,
            type: type,
            scanId: scanId
          }
        })
        .catch(err => {
          console.log(
            "Error while retrieving patientScanFormFAssociations data",
            err.message
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!patientScanFormFExists) {
        throw new createError.NotFound(
          `Form F form with these details not found`
        );
      }

      await patientScanFormFAssociations
        .update(
          {
            formFUploadLink: null,
            formFUploadKey: null
          },
          {
            where: {
              appointmentId: appointmentId,
              type: type,
              scanId: scanId
            },
            transaction: t
          }
        )
        .catch(err => {
          console.log("Error while deleting database record", err.message);
          throw new createError.InternalServerError(
            "Failed to delete record from database"
          );
        });
      const deleteParams = {
        Bucket: this.bucketName,
        Key: patientScanFormFExists.formFUploadKey
      };

      try {
        await this.s3.deleteObject(deleteParams).promise();
        console.log(`Deleted S3 file for Form F form successfully.`);
      } catch (err) {
        console.log("Error while deleting file from S3", err.message);
        throw new createError.InternalServerError(
          "Failed to delete file from S3 after database deletion"
        );
      }

      return `Form F form ${Constants.DELETED_SUCCESSFULLY}`;
    });
  }

  async downloadFormFSampleTemplateService() {
    const { appointmentId, type, scanId } = this._request.query;
    if (!appointmentId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "appointmentId")
      );
    }
    if (!type) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "type")
      );
    }
    if (!scanId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "scanId")
      );
    }

    const data = await PatientScanFormFAssociation.findOne({
      where: {
        appointmentId: appointmentId,
        type: type,
        scanId: scanId
      },
      attributes: ["formFTemplate"]
    }).catch(err => {
      console.log("error while downloading sample form f template", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!data || !data.formFTemplate) {
      throw new createError.NotFound(
        "Form F template not found for the given parameters"
      );
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setContent(data?.formFTemplate, {
      waitUntil: ["load", "domcontentloaded", "networkidle0"]
    });
    const pdf_buffer = await page.pdf({
      format: "a4",
      scale: parseFloat("1"),
      margin: { top: `0.4in`, bottom: `0.4in`, left: `0.4in`, right: `0.4in` },
      height: `11in`,
      width: `8.5in`,
      printBackground: true
    });
    await browser.close();

    this._response.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${appointmentId +
        "_" +
        scanId +
        ".pdf"}`,
      "Content-Length": pdf_buffer.length,
      filename: `${appointmentId}_${scanId}.pdf`
    });

    this._response.send(pdf_buffer);

    // return data;
  }

  async reviewFormFTemplateService() {
    const { appointmentId, type, scanId } = this._request.query;
    if (!appointmentId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "appointmentId")
      );
    }
    if (!type) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "type")
      );
    }
    if (!scanId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "scanId")
      );
    }

    const data = await PatientScanFormFAssociation.findOne({
      where: {
        appointmentId: appointmentId,
        type: type,
        scanId: scanId
      }
    }).catch(err => {
      console.log("error while downloading sample form f template", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!data || !data.formFTemplate) {
      throw new createError.NotFound(
        "Form F template not found for the given parameters"
      );
    }

    await PatientScanFormFAssociation.update(
      {
        isReviewed: this._request.body?.isReviewed
      },
      {
        where: {
          appointmentId: appointmentId,
          type: type,
          scanId: scanId
        }
      }
    ).catch(err => {
      console.log("Error while reviewing form f template", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getFormTemplateByDateRangeService() {
    const { fromDate, toDate } = this._request.query;
    if (!fromDate) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "fromDate")
      );
    }
    if (!toDate) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "toDate")
      );
    }

    const data = await this.mysqlConnection
      .query(getFormFTemplateByDateRangeQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          fromDate: fromDate,
          toDate: toDate
        }
      })
      .catch(err => {
        console.log("Error while getting form f between date range", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      return data;
    }
    return [];
  }

  async downloadScanReportService() {
    const { scanId, appointmentId, type } = this._request.query;
    if (!appointmentId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "AppointmentId")
      );
    }
    if (!scanId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "ScanId")
      );
    }
    if (!type) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Type")
      );
    }

    let data = await ScanResultModel.findOne({
      where: {
        appointmentId: appointmentId,
        type: type,
        scanId: scanId
      }
    }).catch(err => {
      console.log("Error during fetching of Scan Results", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setContent(data.scanResult, {
      waitUntil: ["load", "domcontentloaded", "networkidle0"]
    });
    const pdf_buffer = await page.pdf({
      format: "a4",
      scale: parseFloat("1"),
      margin: { top: `0.1in`, bottom: `0.1in`, left: `0.2in`, right: `0.2in` },
      printBackground: true
    });
    await browser.close();

    this._response.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${"scanTemplate" +
        "_" +
        appointmentId +
        ".pdf"}`,
      "Content-Length": pdf_buffer.length,
      filename: `${"scanTemplate"}_${appointmentId}.pdf`
    });

    this._response.send(pdf_buffer);
  }
}

module.exports = ScanService;
