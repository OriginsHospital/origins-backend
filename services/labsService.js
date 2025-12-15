const lodash = require("lodash");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const {
  getLabtestsByDateQuery,
  getPatientInfoForTemplate,
  getLabHeaderInformation,
  getAllOutsourcingLabtestsQuery,
  getAllLabTests,
  getAllLabTestsQuery
} = require("../queries/lab_queries");
const { Sequelize } = require("sequelize");
const {
  saveLabTestResultSchema,
  saveOutsourcingLabTestResultSchema
} = require("../schemas/labSchema");
const LabTestResultsModel = require("../models/Master/labTestResults");
const LabTestTemplatesMaster = require("../models/Master/labTemplatesMaster");
const GenerateHtmlTemplate = require("../utils/templateUtils");
const moment = require("moment-timezone");
const { labHeaderTemplate } = require("../templates/headerTemplates");
const BaseService = require("../services/baseService");
const puppeteer = require("puppeteer");

class LabsService extends BaseService {
  constructor(request, response, next) {
    super(request, response, next);
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.htmlTemplateGenerationObj = new GenerateHtmlTemplate();
  }

  async getLabtestsByDateService() {
    const { appointmentDate } = this._request.params;
    const { labCategoryType, branchId } = this._request.query;
    if (lodash.isEmpty(appointmentDate.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "appointmentDate")
      );
    }
    const data = await this.mysqlConnection
      .query(getLabtestsByDateQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          appointmentDate: appointmentDate,
          labCategoryType: labCategoryType || null,
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

  async getAllLabTestsService() {
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

    const getAllLabTestsData = await this.mysqlConnection
      .query(getAllLabTestsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          fromDate: fromDate,
          toDate: toDate,
          branchId: branchId || null
        }
      })
      .catch(err => {
        console.log("Error while getting lab tests data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return getAllLabTestsData;
  }

  async getAllOutsourcingLabTestsService() {
    const { searchQuery } = this._request.query;
    const trimmedSearchQuery = searchQuery?.trim();

    let query = getAllOutsourcingLabtestsQuery;
    if (trimmedSearchQuery) {
      query += `
        where patientName LIKE :searchQuery
      `;
    }

    query += `ORDER BY appointmentDate DESC`;

    const getAllOutsourcingLabTestsData = await this.mysqlConnection
      .query(query, {
        replacements: { searchQuery: `%${trimmedSearchQuery}%` },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting outsourcing data", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return getAllOutsourcingLabTestsData;
  }

  async labHeaderInformation(appointmentId, type, labTestId, isSpouse) {
    const labHeaderInformation = await this.mysqlConnection
      .query(getLabHeaderInformation, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          type: type.toLowerCase(),
          appointmentId: appointmentId,
          labTestId: labTestId,
          isSpouse: isSpouse
        }
      })
      .catch(err => {
        console.log("Error while getting the lab header information", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    let headerTemplate = labHeaderTemplate;
    if (!lodash.isEmpty(labHeaderInformation)) {
      headerTemplate = headerTemplate
        .replaceAll(
          "{patientId}",
          labHeaderInformation[0]?.patientInformation?.patientId
        )
        .replaceAll("{age}", labHeaderInformation[0]?.patientInformation?.age)
        .replaceAll(
          "{gender}",
          labHeaderInformation[0]?.patientInformation?.gender
        )
        .replaceAll(
          "{sampleType}",
          labHeaderInformation[0]?.patientInformation?.sampleType
        )
        .replaceAll(
          "{doctorName}",
          labHeaderInformation[0]?.patientInformation?.doctorName
        )
        .replaceAll(
          "{patientName}",
          labHeaderInformation[0]?.patientInformation?.patientName
        )
        .replaceAll(
          "{requestDate}",
          labHeaderInformation[0]?.patientInformation?.requestDate
        )
        .replaceAll(
          "{sampleCollectionOn}",
          moment()
            .tz("Asia/Kolkata")
            .format("DD-MM-YYYY hh:mm A")
        );
    } else {
      headerTemplate = headerTemplate
        .replaceAll("{patientId}", "")
        .replaceAll("{age}", "")
        .replaceAll("{gender}", "")
        .replaceAll("{sampleType}", "")
        .replaceAll("{doctorName}", "")
        .replaceAll("{patientName}", "")
        .replaceAll("{requestDate}", "")
        .replaceAll("{sampleCollectionOn}", "");
    }
    return headerTemplate;
  }

  async getLabTestTemplateByIdService() {
    const { id, appointmentId, type, isSpouse } = this._request.query;
    if (lodash.isEmpty(id)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "lab test id")
      );
    }
    if (lodash.isEmpty(appointmentId)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "appointment id")
      );
    }
    if (lodash.isEmpty(type)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "type")
      );
    }

    if (lodash.isEmpty(isSpouse)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "isSpouse")
      );
    }

    let headerInformation = await this.labHeaderInformation(
      appointmentId,
      type.toLowerCase(),
      id,
      isSpouse
    );

    let data = await LabTestTemplatesMaster.findOne({
      where: {
        labTestId: id
      },
      attributes: ["labTestId", "labTestTemplate"]
    }).catch(err => {
      console.log("Error while getting the lab Test template", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.LAB_TEST_TEMPLATE_NOT_FOUND);
    }
    data.labTestTemplate = data?.labTestTemplate?.replaceAll(
      "{headerTemplate}",
      headerInformation
    );
    // name someplaces kept wrong so adding this also
    data.labTestTemplate = data?.labTestTemplate?.replaceAll(
      "{headerInformation}",
      headerInformation
    );
    // Adding Logo Header Information
    const hospitalLogoHeaderTemplate = await this.hospitalLogoHeaderTemplate(
      appointmentId,
      type
    );
    data.labTestTemplate = data?.labTestTemplate?.replaceAll(
      "{hospitalLogoInformation}",
      hospitalLogoHeaderTemplate
    );
    return data;
  }

  async saveLabTestResultService() {
    let saveLabTestPayload = await saveLabTestResultSchema.validateAsync(
      this._request.body
    );
    let {
      appointmentId,
      type,
      labTestId,
      labTestResult,
      labTestStatus,
      isSpouse
    } = saveLabTestPayload;

    let dataToPush = [];
    if (labTestStatus == 1) {
      let headerInformation = await this.labHeaderInformation(
        appointmentId,
        type.toLowerCase(),
        labTestId,
        isSpouse
      );

      if (lodash.isEmpty(headerInformation)) {
        throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
      }

      labTestResult = await LabTestTemplatesMaster.findOne({
        where: {
          labTestId: labTestId
        }
      }).catch(err => {
        console.log("Error while getting the labTest template", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (lodash.isEmpty(labTestResult)) {
        throw new createError.BadRequest(Constants.LAB_TEST_TEMPLATE_NOT_FOUND);
      }

      const hospitalLogoHeaderTemplate = await this.hospitalLogoHeaderTemplate(
        appointmentId,
        type
      );
      labTestResult = labTestResult?.labTestTemplate
        ?.replaceAll("{headerTemplate}", headerInformation)
        .replaceAll("{hospitalLogoInformation}", hospitalLogoHeaderTemplate)
        .replaceAll("{headerInformation}", headerInformation);
    }

    dataToPush.push({
      appointmentId,
      type,
      labTestId,
      labTestResult,
      labTestStatus,
      isSpouse,
      sampleCollectedOn: moment()
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss")
    });

    return await this.mysqlConnection.transaction(async t => {
      await LabTestResultsModel.destroy({
        where: {
          appointmentId: appointmentId,
          labTestId: labTestId,
          type: type,
          isSpouse: isSpouse
        }
      }).catch(err => {
        console.log("Error while destroying the data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await LabTestResultsModel.bulkCreate(dataToPush).catch(err => {
        console.log("Error while pushing labTest result", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return LabTestResultsModel.findOne({
        where: {
          appointmentId: appointmentId,
          labTestId: labTestId,
          type: type,
          isSpouse: isSpouse
        }
      });
    });
  }

  async saveOutsourcingLabTestResultService() {
    const saveOutsourcingLabTestPayload = await saveOutsourcingLabTestResultSchema.validateAsync(
      this._request.body
    );

    const {
      appointmentId,
      labTestId,
      type,
      labTestStatus,
      isSpouse
    } = saveOutsourcingLabTestPayload;

    const existingRecord = await LabTestResultsModel.findOne({
      where: { appointmentId, labTestId, type, isSpouse }
    });

    if (
      labTestStatus === 2 &&
      (!this._request.files || !this._request.files?.labTestResultFile)
    ) {
      throw new createError.BadRequest("labTestResult File is required!");
    }

    return await this.mysqlConnection.transaction(async t => {
      let fileUrl = existingRecord ? existingRecord.labTestResult : null;

      if (this._request.files?.labTestResultFile) {
        const file = this._request.files.labTestResultFile[0];

        const fileExtension = file.originalname.split(".").pop();
        const key = `labs/outsourcing/${type}/${appointmentId}/${labTestId}.${fileExtension}`;

        const uploadParams = {
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype
        };

        const uploadResult = await this.s3.upload(uploadParams).promise();
        fileUrl = uploadResult.Location;
      }

      if (existingRecord) {
        await existingRecord.update(
          { labTestStatus, labTestResult: fileUrl },
          { transaction: t }
        );
      } else {
        await LabTestResultsModel.create(
          {
            appointmentId,
            labTestId,
            type,
            labTestStatus,
            isSpouse,
            labTestResult: fileUrl || "",
            sampleCollectedOn: moment()
              .tz("Asia/Kolkata")
              .format("YYYY-MM-DD HH:mm:ss")
          },
          { transaction: t }
        );
      }

      return await LabTestResultsModel.findOne({
        where: {
          appointmentId: appointmentId,
          labTestId: labTestId,
          type: type,
          isSpouse: isSpouse
        }
      });
    });
  }

  async getSavedLabtestResultService() {
    const { type, appointmentId, labTestId, isSpouse } = this._request.query;
    try {
      const getSavedLabTestResult = await LabTestResultsModel.findOne({
        where: {
          appointmentId: appointmentId,
          type: type,
          labTestId: labTestId,
          isSpouse: isSpouse
        }
      });

      return getSavedLabTestResult;
    } catch (error) {
      console.error(
        "Error while fetching saved labTest test values:",
        error.message
      );
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async deleteLabOursourcingTestResultService() {
    const { labTestResultId } = this._request.params;
    if (lodash.isEmpty(labTestResultId)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "labTestResultId")
      );
    }
    return await this.mysqlConnection.transaction(async t => {
      const result = await LabTestResultsModel.findOne({
        where: {
          id: labTestResultId
        }
      });

      if (!result) {
        throw new createError.NotFound(Constants.LAB_TEST_RESULT_NOT_FOUND);
      }

      // check labTestResult includes /labs/oursourcing and delete it from s3 bucket
      if (result.labTestResult.includes("/labs/outsourcing")) {
        const key = result.labTestResult.split(".com/")[1];
        const params = {
          Bucket: this.bucketName,
          Key: key
        };
        try {
          await this.s3.deleteObject(params).promise();
        } catch (err) {
          console.error("Error while deleting object from S3:", err.message);
        }
      }

      await LabTestResultsModel.update(
        {
          labTestResult: null,
          labTestStatus: 1
        },
        {
          where: {
            id: labTestResultId
          }
        }
      );

      return Constants.DELETED_SUCCESSFULLY;
    });
  }

  async downloadLabReportService() {
    const { labTestId, appointmentId, type } = this._request.query;
    if (!appointmentId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "AppointmentId")
      );
    }
    if (!labTestId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "labTestId")
      );
    }
    if (!type) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Type")
      );
    }

    let data = await LabTestResultsModel.findOne({
      where: {
        appointmentId: appointmentId,
        type: type,
        labTestId: labTestId
      }
    }).catch(err => {
      console.log("Error during fetching of Lab Test Results", err);
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
    await page.setContent(data.labTestResult, {
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
      "Content-Disposition": `attachment; filename=${"labTestTemplate" +
        "_" +
        appointmentId +
        ".pdf"}`,
      "Content-Length": pdf_buffer.length,
      filename: `${"labTestTemplate"}_${appointmentId}.pdf`
    });

    this._response.send(pdf_buffer);
  }
}

module.exports = LabsService;
