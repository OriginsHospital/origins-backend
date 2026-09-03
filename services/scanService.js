const lodash = require("lodash");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const {
  getScansByDateQuery,
  getFormFTemplateByDateRangeQuery,
  getScanHeaderInformation,
  getScanReportsQuery,
  getPrescriptionsByDateQuery,
  getOpuSheetsByDateQuery,
  getFollicularSheetsByDateQuery,
  getHysteroLapByDateQuery,
  getDischargeCardsByDateQuery,
  getUptResultsQuery
} = require("../queries/scan_queries");
const { Sequelize } = require("sequelize");
const ScanTemplatesMaster = require("../models/Master/ScanTemplatesMaster");
const {
  saveScanResultSchema,
  uploadFormFForScanSchema,
  deleteFormFForScanSchema,
  saveUptResultSchema,
  editUptResultSchema,
  saveDischargeCardSchema
} = require("../schemas/scanSchema");
const ScanResultModel = require("../models/Master/ScanResultMaster");
const UptResultsMaster = require("../models/Master/uptResultsMaster");
const PatientDischargeCardAssociations = require("../models/Associations/patientDischargeCardAssociations");
const patientScanFormFAssociations = require("../models/Associations/patientScanFormFAssociation");
const AWSConnection = require("../connections/aws_connection");
const { getPatientInfoForTemplate } = require("../queries/lab_queries");
const PatientScanFormFAssociation = require("../models/Associations/patientScanFormFAssociation");
const { scanHeaderTemplate } = require("../templates/headerTemplates");
const BaseService = require("./baseService");
const {
  compactScanTemplateForPrint,
  prepareScanReportForPdf,
  computeFitToSinglePageScale
} = require("../utils/scanPrintUtils");

const puppeteer = require("puppeteer");

const dayjsSafeDate = value => {
  if (!value) return value;
  if (typeof value === "string") return value.slice(0, 10);
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

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

  async getPrescriptionsByDateService() {
    const { appointmentDate } = this._request.params;
    const { branchId } = this._request.query;
    if (lodash.isEmpty(String(appointmentDate || "").trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "appointmentDate")
      );
    }
    const data = await this.mysqlConnection
      .query(getPrescriptionsByDateQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          appointmentDate: appointmentDate,
          branchId: branchId || null
        }
      })
      .catch(err => {
        console.log("Error while getting prescriptions by date", err);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async getHysteroLapByDateService() {
    const { appointmentDate } = this._request.params;
    const { branchId } = this._request.query;
    if (lodash.isEmpty(String(appointmentDate || "").trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "appointmentDate")
      );
    }
    const data = await this.mysqlConnection
      .query(getHysteroLapByDateQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          appointmentDate: appointmentDate,
          branchId: branchId || null
        }
      })
      .catch(err => {
        console.log("Error while getting Hystero/Lap by date", err);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async getOpuSheetsByDateService() {
    const { appointmentDate } = this._request.params;
    const { branchId } = this._request.query;
    if (lodash.isEmpty(String(appointmentDate || "").trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "appointmentDate")
      );
    }
    const data = await this.mysqlConnection
      .query(getOpuSheetsByDateQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          appointmentDate: appointmentDate,
          branchId: branchId || null
        }
      })
      .catch(err => {
        console.log("Error while getting OPU sheets by date", err);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  parseFollicularSheetFromTemplate(template) {
    if (!template) return null;
    let parsed = template;
    if (typeof template === "string") {
      try {
        parsed = JSON.parse(template);
      } catch (err) {
        console.log("Error while parsing follicular treatment sheet", err);
        return null;
      }
    }
    if (!parsed || typeof parsed !== "object") return null;
    return parsed.follicularSheet || null;
  }

  async getFollicularSheetsByDateService() {
    const { appointmentDate } = this._request.params;
    const { branchId } = this._request.query;
    if (lodash.isEmpty(String(appointmentDate || "").trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "appointmentDate")
      );
    }
    const data = await this.mysqlConnection
      .query(getFollicularSheetsByDateQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          appointmentDate: appointmentDate,
          branchId: branchId || null
        }
      })
      .catch(err => {
        console.log("Error while getting follicular sheets by date", err);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return (data || []).map(row => {
      const follicularSheet = this.parseFollicularSheetFromTemplate(
        row.treatmentSheetTemplate
      );
      const { treatmentSheetTemplate, ...rest } = row;
      return {
        ...rest,
        follicularSheet,
        hasSheet: follicularSheet ? 1 : Number(row.hasSheet) || 0
      };
    });
  }

  async getScanReportsService() {
    const { fromDate, toDate, branchId = null } = this._request.query;
    if (lodash.isEmpty(fromDate?.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "fromDate")
      );
    }
    if (lodash.isEmpty(toDate?.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "toDate")
      );
    }

    const data = await this.mysqlConnection
      .query(getScanReportsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          fromDate,
          toDate,
          branchId: branchId || null
        }
      })
      .catch(err => {
        console.log("Error while getting scan reports", err);
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

    data.scanTemplate = compactScanTemplateForPrint(data.scanTemplate);

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

      if (getSavedScanResult?.scanResult) {
        getSavedScanResult.scanResult = compactScanTemplateForPrint(
          getSavedScanResult.scanResult
        );
      }

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

    const reportHtml = prepareScanReportForPdf(data.scanResult);
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 1
      });
      await page.emulateMediaType("print");
      await page.setContent(reportHtml, {
        waitUntil: ["load", "domcontentloaded", "networkidle0"]
      });
      await page.evaluate(async () => {
        await Promise.all(
          Array.from(document.images).map(img =>
            img.complete
              ? null
              : new Promise(resolve => {
                  img.onload = resolve;
                  img.onerror = resolve;
                })
          )
        );
      });

      const contentHeight = await page.evaluate(() =>
        Math.max(
          document.body ? document.body.scrollHeight : 0,
          document.documentElement ? document.documentElement.scrollHeight : 0
        )
      );
      const scale = computeFitToSinglePageScale(contentHeight);

      const pdf_buffer = await page.pdf({
        format: "a4",
        scale,
        margin: {
          top: "8mm",
          bottom: "8mm",
          left: "10mm",
          right: "10mm"
        },
        printBackground: true,
        displayHeaderFooter: false
      });

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
    } finally {
      await browser.close();
    }
  }

  async getUptResultsService() {
    const {
      fromDate,
      toDate,
      branchId,
      cycleType,
      uptResult,
      createdByNurseId,
      search
    } = this._request.query;

    let query = getUptResultsQuery;
    const whereConditions = [];
    const replacements = {};

    if (fromDate) {
      whereConditions.push("CAST(ur.resultDate AS DATE) >= :fromDate");
      replacements.fromDate = fromDate;
    }
    if (toDate) {
      whereConditions.push("CAST(ur.resultDate AS DATE) <= :toDate");
      replacements.toDate = toDate;
    }
    if (branchId) {
      whereConditions.push("ur.branchId = :branchId");
      replacements.branchId = branchId;
    }
    if (cycleType) {
      whereConditions.push("ur.cycleType = :cycleType");
      replacements.cycleType = cycleType;
    }
    if (uptResult) {
      whereConditions.push("ur.uptResult = :uptResult");
      replacements.uptResult = uptResult;
    }
    if (createdByNurseId) {
      whereConditions.push("ur.createdByNurseId = :createdByNurseId");
      replacements.createdByNurseId = createdByNurseId;
    }
    if (search && String(search).trim()) {
      whereConditions.push(`(
        pm.patientId LIKE :search
        OR CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) LIKE :search
        OR pm.mobileNo LIKE :search
        OR opm.personName LIKE :search
      )`);
      replacements.search = `%${String(search).trim()}%`;
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }
    query += ` ORDER BY ur.resultDate DESC, ur.id DESC`;

    return this.mysqlConnection
      .query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements
      })
      .catch(err => {
        console.log("Error while getting UPT results", err);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async saveUptResultService() {
    const validatedPayload = await saveUptResultSchema.validateAsync(
      this._request.body
    );

    const resultDate =
      typeof validatedPayload.resultDate === "string"
        ? validatedPayload.resultDate.slice(0, 10)
        : dayjsSafeDate(validatedPayload.resultDate);

    return UptResultsMaster.create({
      ...validatedPayload,
      resultDate,
      createdBy: this._request?.userDetails?.id || null
    }).catch(err => {
      console.log("Error while saving UPT result", err);
      throw createError.InternalServerError(Constants.SOMETHING_ERROR_OCCURRED);
    });
  }

  async editUptResultService() {
    const validatedPayload = await editUptResultSchema.validateAsync(
      this._request.body
    );

    const existing = await UptResultsMaster.findOne({
      where: { id: validatedPayload.id }
    }).catch(err => {
      console.log("Error while fetching UPT result", err);
      throw createError.InternalServerError(Constants.SOMETHING_ERROR_OCCURRED);
    });

    if (lodash.isEmpty(existing)) {
      throw createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    const { id, ...rest } = validatedPayload;
    const resultDate =
      typeof rest.resultDate === "string"
        ? rest.resultDate.slice(0, 10)
        : dayjsSafeDate(rest.resultDate);

    await UptResultsMaster.update(
      { ...rest, resultDate },
      { where: { id } }
    ).catch(err => {
      console.log("Error while updating UPT result", err);
      throw createError.InternalServerError(Constants.SOMETHING_ERROR_OCCURRED);
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async deleteUptResultService() {
    const { id } = this._request.params;
    if (!id) {
      throw createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "id")
      );
    }

    const existing = await UptResultsMaster.findOne({
      where: { id }
    }).catch(err => {
      console.log("Error while fetching UPT result for delete", err);
      throw createError.InternalServerError(Constants.SOMETHING_ERROR_OCCURRED);
    });

    if (lodash.isEmpty(existing)) {
      throw createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    await UptResultsMaster.destroy({ where: { id } }).catch(err => {
      console.log("Error while deleting UPT result", err);
      throw createError.InternalServerError(Constants.SOMETHING_ERROR_OCCURRED);
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  parseDischargeCardData(cardData) {
    if (!cardData) return null;
    if (typeof cardData === "string") {
      try {
        return JSON.parse(cardData);
      } catch (err) {
        return null;
      }
    }
    return cardData;
  }

  normalizeFlag(value) {
    if (value === true || value === 1 || value === "1") return 1;
    if (Buffer.isBuffer(value)) return value[0] ? 1 : 0;
    if (value && typeof value === "object" && Array.isArray(value.data)) {
      return value.data[0] ? 1 : 0;
    }
    const parsed = Number(value);
    return parsed === 1 ? 1 : 0;
  }

  async getDischargeCardsByDateService() {
    const { appointmentDate } = this._request.params;
    const { branchId } = this._request.query;
    if (lodash.isEmpty(String(appointmentDate || "").trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "appointmentDate")
      );
    }

    return this.mysqlConnection
      .query(getDischargeCardsByDateQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          appointmentDate,
          branchId: branchId || null
        }
      })
      .then(rows =>
        (rows || []).map(row => ({
          ...row,
          hasSavedCard: this.normalizeFlag(row.hasSavedCard)
        }))
      )
      .catch(err => {
        console.log("Error while getting discharge cards by date", err);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async getDischargeCardService() {
    const { visitId, patientId } = this._request.query;
    if (!visitId && !patientId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "visitId or patientId")
      );
    }

    let data = null;
    if (visitId) {
      data = await PatientDischargeCardAssociations.findOne({
        where: { visitId }
      }).catch(err => {
        console.log("Error while fetching discharge card", err);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    if (lodash.isEmpty(data) && patientId) {
      data = await PatientDischargeCardAssociations.findOne({
        where: { patientId },
        order: [["updatedAt", "DESC"], ["id", "DESC"]]
      }).catch(err => {
        console.log("Error while fetching discharge card by patient", err);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    if (lodash.isEmpty(data)) {
      return null;
    }

    const plain = data.toJSON ? data.toJSON() : data;
    return {
      ...plain,
      cardData: this.parseDischargeCardData(plain.cardData)
    };
  }

  async saveDischargeCardService() {
    const validatedPayload = await saveDischargeCardSchema.validateAsync(
      this._request.body
    );
    const userId = this._request?.userDetails?.id || null;
    const {
      visitId,
      patientId,
      appointmentId = null,
      appointmentType = null,
      treatmentCycleId = null,
      cardData
    } = validatedPayload;

    const existing = await PatientDischargeCardAssociations.findOne({
      where: { visitId }
    }).catch(err => {
      console.log("Error while fetching discharge card for save", err);
      throw createError.InternalServerError(Constants.SOMETHING_ERROR_OCCURRED);
    });

    if (existing) {
      await PatientDischargeCardAssociations.update(
        {
          patientId,
          appointmentId,
          appointmentType: appointmentType || null,
          treatmentCycleId,
          cardData,
          updatedBy: userId
        },
        { where: { visitId } }
      ).catch(err => {
        console.log("Error while updating discharge card", err);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    } else {
      await PatientDischargeCardAssociations.create({
        visitId,
        patientId,
        appointmentId,
        appointmentType: appointmentType || null,
        treatmentCycleId,
        cardData,
        createdBy: userId,
        updatedBy: userId
      }).catch(err => {
        console.log("Error while creating discharge card", err);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    const saved = await PatientDischargeCardAssociations.findOne({
      where: { visitId }
    });
    const plain = saved?.toJSON ? saved.toJSON() : saved;
    return {
      ...plain,
      cardData: this.parseDischargeCardData(plain?.cardData)
    };
  }
}

module.exports = ScanService;
