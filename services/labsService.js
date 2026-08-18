const lodash = require("lodash");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const {
  getLabtestsByDateQuery,
  getPatientInfoForTemplate,
  getLabHeaderInformation,
  getAllOutsourcingLabtestsQuery,
  getAllLabTestsQuery,
  getLabReportsQuery
} = require("../queries/lab_queries");
const { Sequelize } = require("sequelize");
const {
  saveLabTestResultSchema,
  saveOutsourcingLabTestResultSchema,
  uploadLabPatientImageSchema
} = require("../schemas/labSchema");
const LabTestResultsModel = require("../models/Master/labTestResults");
const LabPatientImages = require("../models/Master/labPatientImages");
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

  parseOptionalBranchId(branchId) {
    if (
      branchId === undefined ||
      branchId === null ||
      String(branchId).trim() === "" ||
      ["null", "undefined"].includes(
        String(branchId)
          .trim()
          .toLowerCase()
      )
    ) {
      return null;
    }
    const parsed = Number(branchId);
    return Number.isFinite(parsed) ? parsed : null;
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
          labCategoryType:
            labCategoryType === undefined ||
            labCategoryType === null ||
            String(labCategoryType).trim() === ""
              ? null
              : labCategoryType,
          branchId: this.parseOptionalBranchId(branchId)
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
          branchId: this.parseOptionalBranchId(branchId)
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
    const { searchQuery, branchId = null } = this._request.query;
    const trimmedSearchQuery = searchQuery?.trim();
    const parsedBranchId = this.parseOptionalBranchId(branchId);

    let query = getAllOutsourcingLabtestsQuery;
    const conditions = [];
    if (trimmedSearchQuery) {
      conditions.push("patientName LIKE :searchQuery");
    }
    if (parsedBranchId) {
      conditions.push("branchId = :branchId");
    }
    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY appointmentDate DESC`;

    const getAllOutsourcingLabTestsData = await this.mysqlConnection
      .query(query, {
        replacements: {
          searchQuery: `%${trimmedSearchQuery}%`,
          branchId: parsedBranchId
        },
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

  async getLabReportsService() {
    const {
      fromDate,
      toDate,
      branchId = null,
      labCategoryType
    } = this._request.query;

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
    if (lodash.isEmpty(labCategoryType?.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "labCategoryType")
      );
    }

    const parsedCategoryType = Number(labCategoryType);
    if (![0, 1].includes(parsedCategoryType)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "labCategoryType")
      );
    }

    const reportsData = await this.mysqlConnection
      .query(getLabReportsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          fromDate,
          toDate,
          branchId: this.parseOptionalBranchId(branchId),
          labCategoryType: parsedCategoryType
        }
      })
      .catch(err => {
        console.log("Error while getting lab reports data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return reportsData;
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

  isAntenatalVisit(visitTypeId, visitTypeName) {
    const typeName = String(visitTypeName || "").toLowerCase();
    return Number(visitTypeId) === 2 || typeName.includes("antenatal");
  }

  async getVisitTypeForAppointment(appointmentId, type) {
    const isConsultation = String(type).toUpperCase() === "CONSULTATION";
    const query = isConsultation
      ? `SELECT pva.type AS visitTypeId,
          (SELECT vtm.name FROM visit_type_master vtm WHERE vtm.id = pva.type) AS visitType
         FROM consultation_appointments_associations caa
         INNER JOIN visit_consultations_associations vca ON caa.consultationId = vca.id
         INNER JOIN patient_visits_association pva ON pva.id = vca.visitId
         WHERE caa.id = :appointmentId
         LIMIT 1`
      : `SELECT pva.type AS visitTypeId,
          (SELECT vtm.name FROM visit_type_master vtm WHERE vtm.id = pva.type) AS visitType
         FROM treatment_appointments_associations taa
         INNER JOIN visit_treatment_cycles_associations vtca ON taa.treatmentCycleId = vtca.id
         INNER JOIN patient_visits_association pva ON pva.id = vtca.visitId
         WHERE taa.id = :appointmentId
         LIMIT 1`;

    const rows = await this.mysqlConnection
      .query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { appointmentId }
      })
      .catch(err => {
        console.log("Error while getting visit type for appointment", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return rows?.[0] || null;
  }

  async uploadLabPatientImageToS3(file, appointmentId, type, imageType) {
    const uniqueFileName = `${file.originalname.split(".")[0]}_${Date.now()}`;
    const extension = file.originalname.split(".").pop();
    const key = `labs/patient-images/${type}/${appointmentId}/${imageType}/${uniqueFileName}.${extension}`;

    const uploadParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    const uploadResult = await this.s3.upload(uploadParams).promise();
    return {
      imageUrl: uploadResult.Location,
      imageKey: key
    };
  }

  async uploadLabPatientImagesService() {
    const payload = await uploadLabPatientImageSchema.validateAsync(
      this._request.body
    );
    const { appointmentId, type, imageType } = payload;
    const files = this._request.files?.labPatientImages;

    if (!files || files.length === 0) {
      throw new createError.BadRequest(Constants.LAB_PATIENT_IMAGE_REQUIRED);
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp"
    ];
    const maxFileSize = 5 * 1024 * 1024;

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new createError.BadRequest(Constants.LAB_PATIENT_IMAGE_INVALID);
      }
      if (file.size > maxFileSize) {
        throw new createError.BadRequest(Constants.LAB_PATIENT_IMAGE_TOO_LARGE);
      }
    }

    if (imageType === "NST") {
      const visitInfo = await this.getVisitTypeForAppointment(
        appointmentId,
        type
      );
      if (
        !visitInfo ||
        !this.isAntenatalVisit(visitInfo.visitTypeId, visitInfo.visitType)
      ) {
        throw new createError.BadRequest(Constants.NST_ONLY_FOR_ANTENATAL);
      }
    }

    const uploadedBy = this._request.userDetails?.id || null;

    return await this.mysqlConnection.transaction(async t => {
      const uploadedImages = [];

      for (const file of files) {
        const { imageUrl, imageKey } = await this.uploadLabPatientImageToS3(
          file,
          appointmentId,
          type,
          imageType
        );

        const createdImage = await LabPatientImages.create(
          {
            appointmentId,
            type,
            imageType,
            imageUrl,
            imageKey,
            uploadedBy
          },
          { transaction: t }
        ).catch(err => {
          console.log("Error while saving lab patient image", err.message);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

        uploadedImages.push({
          id: createdImage.id,
          appointmentId,
          type,
          imageType,
          imageUrl,
          imageKey
        });
      }

      return uploadedImages;
    });
  }

  async getLabPatientImagesService() {
    const { appointmentId, type, imageType } = this._request.query;

    if (lodash.isEmpty(String(appointmentId || "").trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "appointmentId")
      );
    }
    if (lodash.isEmpty(String(type || "").trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "type")
      );
    }

    const where = {
      appointmentId,
      type: String(type).toUpperCase()
    };

    if (imageType) {
      where.imageType = String(imageType).toUpperCase();
    }

    return LabPatientImages.findAll({
      where,
      order: [["createdAt", "DESC"]]
    }).catch(err => {
      console.log("Error while fetching lab patient images", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async deleteLabPatientImageService() {
    const { imageId } = this._request.params;
    if (lodash.isEmpty(String(imageId || "").trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "imageId")
      );
    }

    const imageRecord = await LabPatientImages.findByPk(imageId);
    if (!imageRecord) {
      throw new createError.NotFound(Constants.LAB_PATIENT_IMAGE_NOT_FOUND);
    }

    try {
      await this.s3
        .deleteObject({ Bucket: this.bucketName, Key: imageRecord.imageKey })
        .promise();
    } catch (err) {
      console.log(
        "Error while deleting lab patient image from S3:",
        err.message
      );
    }

    await LabPatientImages.destroy({ where: { id: imageId } });
    return Constants.DELETED_SUCCESSFULLY;
  }
}

module.exports = LabsService;
