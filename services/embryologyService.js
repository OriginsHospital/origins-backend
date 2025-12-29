const { Sequelize } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const lodash = require("lodash");
const { PDFDocument } = require("pdf-lib");
const puppeteer = require("puppeteer");
const {
  getPatientListForEmbryology,
  getPatientDetailsForTemplate,
  getEmbryologyDetailsByConsultationAppointmentId,
  getEmbryologyDetailsByTreatmentAppointmentId,
  embryologyImagesByConsultationIdAndType,
  embryologyImagesByTreatmentIdAndType
} = require("../queries/embryology_queries");
const { getPatientInfoForTemplate } = require("../queries/lab_queries");
const {
  saveEmbryologyTreatmentSchema,
  editEmbryologyTreatmentSchema,
  saveEmbryologyConsultationSchema,
  editEmbryologyConsultationSchema,
  uploadEmbryologyImageSchema,
  deleteEmbryologyImageSchema
} = require("../schemas/treatmentEmbryologySchema");
const treatmentEmbryology = require("../models/Associations/treatmentEmbryology");
const consultationEmbryology = require("../models/Associations/consultationEmbryology");
const AWSConnection = require("../connections/aws_connection");
const embryologyTemplate = require("../templates/embyologyTemplate");
const GenerateHtmlTemplate = require("../utils/templateUtils");
const EmbryologyFormatMaster = require("../models/Master/embryologyFormatsMaster");
const BaseService = require("./baseService");
const treatmentEmbryologyImages = require("../models/Associations/treatmentEmbryologyImages");
const consultationEmbryologyImages = require("../models/Associations/consultationEmbryologyImages");
const {
  embryologyImagesTemplate
} = require("../templates/embryologyImagesTemplate");
class EmbryologyService extends BaseService {
  constructor(request, response, next) {
    super(request, response, next);
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.s3 = AWSConnection.getS3();
    this.bucketName = AWSConnection.getS3BucketName();
    this.htmlTemplateGenerationObj = new GenerateHtmlTemplate();
  }

  async patientListForEmbryologyService() {
    const { branchId } = this._request.query;
    let data = await this.mysqlConnection
      .query(getPatientListForEmbryology, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          branchId: branchId || null
        }
      })
      .catch(err => {
        console.log("Error while fetching the embryology details", err);
      });

    if (!lodash.isEmpty(data)) {
      data = data
        .map(row => {
          return {
            ...row,
            embryologyDetails: lodash.sortBy(
              row?.embryologyDetails.filter(
                detail => detail.paymentStatus === "PAID"
              ),
              "embryologyId"
            )
          };
        })
        .filter(row => row?.embryologyDetails.length > 0); // Show only if one is paid
      return data;
    }
    return [];
  }

  async uploadEmbryologyImage(treatmentCycleId, categoryType, file) {
    try {
      const key = `Embryology/${treatmentCycleId}/${categoryType}`;
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      };
      const uploadResult = await this.s3.upload(uploadParams).promise();
      return uploadResult.Location;
    } catch (error) {
      console.error("Error uploading Embryology image to S3:", error);
      throw createError.InternalServerError(Constants.SOMETHING_ERROR_OCCURRED);
    }
  }

  async uploadEmbryologyImageConsultation(consultationId, categoryType, file) {
    try {
      const key = `EmbryologyConsultation/${consultationId}/${categoryType}`;
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      };
      const uploadResult = await this.s3.upload(uploadParams).promise();
      return uploadResult.Location;
    } catch (error) {
      console.error("Error uploading Embryology image to S3:", error);
      throw createError.InternalServerError(Constants.SOMETHING_ERROR_OCCURRED);
    }
  }

  async deleteEmbryologyImage(imageKey) {
    try {
      const deleteParams = {
        Bucket: this.bucketName,
        Key: imageKey
      };

      await this.s3.deleteObject(deleteParams).promise();
      console.log(`Successfully deleted old image: ${imageKey}`);
    } catch (error) {
      console.error("Error deleting Embryology image from S3:", error);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async uploadTreatmentEmbyrologyImageToS3(
    file,
    categoryType,
    treatmentEmbryologyId
  ) {
    try {
      const uniqueFileName = `${file.originalname.split(".")[0]}_${Date.now()}`;
      const extension = file.originalname.split(".").pop();
      const key = `Embryology/${treatmentEmbryologyId}/${categoryType}/${uniqueFileName}.${extension}`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      };

      const uploadResult = await this.s3.upload(uploadParams).promise();
      console.log("Image uploaded to S3:", uploadResult.Location);
      return {
        imageUrl: uploadResult.Location,
        imageKey: key
      };
    } catch (err) {
      console.log("Error while uploading embryology image to S3: ", err);
      throw new Error("Error while uploading image");
    }
  }

  async uploadConsultationEmbryologyImageToS3(
    file,
    categoryType,
    consultationEmbryologyId
  ) {
    try {
      const uniqueFileName = `${file.originalname.split(".")[0]}_${Date.now()}`;
      const extension = file.originalname.split(".").pop();
      const key = `EmbryologyConsultation/${consultationEmbryologyId}/${categoryType}/${uniqueFileName}.${extension}`;

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
    } catch (err) {
      console.log("Error while uploading embryology image to S3: ", err);
      throw new Error("Error while uploading image");
    }
  }

  async uploadEmbryologyImageService() {
    return await this.mysqlConnection.transaction(async t => {
      const validatedSaveData = await uploadEmbryologyImageSchema.validateAsync(
        this._request.body
      );

      if (!(this._request?.files && this._request?.files?.embryologyImage)) {
        throw createError.BadRequest(
          "please upload atleast one file to proceed"
        );
      }

      const { embryologyId, type } = validatedSaveData;

      let EmbryologyModel;
      let EmbryologyImagesMethod;
      let EmbryologyImagesModel;
      if (type === "treatment") {
        EmbryologyModel = treatmentEmbryology;
        EmbryologyImagesMethod = this.uploadTreatmentEmbyrologyImageToS3;
        EmbryologyImagesModel = treatmentEmbryologyImages;
      } else if (type === "consultation") {
        EmbryologyModel = consultationEmbryology;
        EmbryologyImagesMethod = this.uploadEmbryologyImageConsultation;
        EmbryologyImagesModel = consultationEmbryologyImages;
      }

      const createdRecord = await EmbryologyModel.findOne({
        where: { id: embryologyId }
      });

      if (!createdRecord) {
        throw createError.NotFound(Constants.EMBRYOLOGY_RECORD_NOT_FOUND);
      }

      console.log("Created Record:", createdRecord?.dataValues?.categoryType);

      let uploadedImages = [];

      if (this._request?.files && this._request?.files?.embryologyImage) {
        for (const file of this._request.files.embryologyImage) {
          let imageKey, imageUrl;
          if (type === "treatment") {
            ({
              imageKey,
              imageUrl
            } = await this.uploadTreatmentEmbyrologyImageToS3(
              file,
              createdRecord?.dataValues?.categoryType,
              createdRecord?.dataValues?.id
            ));
          } else {
            ({
              imageKey,
              imageUrl
            } = await this.uploadConsultationEmbryologyImageToS3(
              file,
              createdRecord?.dataValues?.categoryType,
              createdRecord?.dataValues?.id
            ));
          }

          await EmbryologyImagesModel.create(
            {
              [type === "treatment"
                ? "treatmentEmbryologyId"
                : "consultationEmbryologyId"]: createdRecord?.id,
              imageUrl,
              imageKey,
              uploadedBy: this._request.userDetails?.id
            },
            { transaction: t }
          ).catch(err => {
            console.log(
              "Error while uploading embryology reference image",
              err.message
            );
            throw new createError.InternalServerError(
              Constants.SOMETHING_ERROR_OCCURRED
            );
          });

          uploadedImages.push({ imageUrl, imageKey });
        }
      }

      return "Successfully uploaded images";
    });
  }

  async deleteEmbryologyImageService() {
    const validatedData = await deleteEmbryologyImageSchema.validateAsync(
      this._request.body
    );

    return await this.mysqlConnection.transaction(async t => {
      const { embryologyImageId, type } = validatedData;
      let EmbryologyImagesModel;
      if (type === "treatment") {
        EmbryologyImagesModel = treatmentEmbryologyImages;
      } else if (type === "consultation") {
        EmbryologyImagesModel = consultationEmbryologyImages;
      }

      const imageRecord = await EmbryologyImagesModel.findOne({
        where: { id: embryologyImageId },
        transaction: t
      });

      if (!imageRecord) {
        throw createError.NotFound("Embryology image not found");
      }

      const deletedImage = await EmbryologyImagesModel.destroy({
        where: { id: embryologyImageId },
        transaction: t
      });

      if (imageRecord) {
        const imageKey = imageRecord?.imageKey;
        await this.deleteEmbryologyImage(imageKey);
      }

      if (!deletedImage) {
        throw createError.NotFound("Embryology image not found");
      }

      return "Successfully deleted image";
    });
  }

  async saveEmbryologyTreatmentService() {
    try {
      return await this.mysqlConnection.transaction(async t => {
        const validatedSaveData = await saveEmbryologyTreatmentSchema.validateAsync(
          this._request.body
        );

        const createdRecord = await treatmentEmbryology.create(
          validatedSaveData,
          {
            transaction: t
          }
        );

        const uploadedImages = [];

        if (this._request?.files && this._request?.files?.embryologyImage) {
          for (const file of this._request.files.embryologyImage) {
            const {
              imageUrl,
              imageKey
            } = await this.uploadTreatmentEmbyrologyImageToS3(
              file,
              createdRecord?.categoryType,
              createdRecord?.id
            );

            await treatmentEmbryologyImages
              .create(
                {
                  treatmentEmbryologyId: createdRecord?.id,
                  imageUrl,
                  imageKey,
                  uploadedBy: this._request.userDetails?.id
                },
                { transaction: t }
              )
              .catch(err => {
                console.log(
                  "Error while uploading embryology reference image",
                  err.message
                );
                throw new createError.InternalServerError(
                  Constants.SOMETHING_ERROR_OCCURRED
                );
              });

            uploadedImages.push({ imageUrl, imageKey });
          }
        }
        return {
          ...createdRecord.toJSON(),
          images: uploadedImages
        };
      });
    } catch (err) {
      console.log("Error while saving treatment embryology:", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async saveEmbryologyConsultationService() {
    try {
      return await this.mysqlConnection.transaction(async t => {
        const validatedSaveData = await saveEmbryologyConsultationSchema.validateAsync(
          this._request.body
        );

        const createdRecord = await consultationEmbryology.create(
          validatedSaveData,
          {
            transaction: t
          }
        );

        const uploadedImages = [];

        if (this._request?.files && this._request?.files?.embryologyImage) {
          for (const file of this._request.files.embryologyImage) {
            const {
              imageUrl,
              imageKey
            } = await this.uploadConsultationEmbryologyImageToS3(
              file,
              createdRecord?.categoryType,
              createdRecord?.id
            );

            await consultationEmbryologyImages
              .create(
                {
                  consultationEmbryologyId: createdRecord?.id,
                  imageUrl,
                  imageKey,
                  uploadedBy: this._request.userDetails?.id
                },
                { transaction: t }
              )
              .catch(err => {
                console.log(
                  "Error while uploading embryology reference image",
                  err.message
                );
                throw new createError.InternalServerError(
                  Constants.SOMETHING_ERROR_OCCURRED
                );
              });

            uploadedImages.push({ imageUrl, imageKey });
          }
        }
        return {
          ...createdRecord.toJSON(),
          images: uploadedImages
        };
      });
    } catch (err) {
      console.log("Error while saving consultation embryology:", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async getEmbryologyDataByTreamentCycleIdService() {
    try {
      const treatementCycleId = this._request.params.treatementCycleId;
      if (!treatementCycleId) {
        throw new createError.BadRequest(
          Constants.PARAMS_ERROR.replace("{params}", "treatementCycleId")
        );
      }
      return await this.mysqlConnection
        .query(getEmbryologyDetailsByTreatmentAppointmentId, {
          replacements: {
            appointmentId: treatementCycleId
          },
          type: Sequelize.QueryTypes.SELECT
        })
        .catch(err => {
          console.log("Error while getting the embryology data", err);
        });
    } catch (err) {
      console.log("Error while fetching treatment embryology:", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async getEmbryologyDataByConsultationIdService() {
    try {
      const consultationId = this._request.params.consultationId;
      if (!consultationId) {
        throw new createError.BadRequest(
          Constants.PARAMS_ERROR.replace("{params}", "consultationId")
        );
      }
      return await this.mysqlConnection
        .query(getEmbryologyDetailsByConsultationAppointmentId, {
          replacements: {
            appointmentId: consultationId
          },
          type: Sequelize.QueryTypes.SELECT
        })
        .catch(err => {
          console.log("Error while getting the embryology data", err);
        });
    } catch (err) {
      console.log("Error while fetching treatment embryology:", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async editEmbryologyTreatmentService() {
    try {
      const { id } = this._request.params;

      if (!id) {
        throw new createError.BadRequest(
          Constants.PARAMS_ERROR.replace("{params}", "id")
        );
      }

      const validatedEditData = await editEmbryologyTreatmentSchema.validateAsync(
        this._request.body
      );

      const existingRecord = await treatmentEmbryology.findOne({
        where: {
          id: id
        }
      });

      if (!existingRecord) {
        throw new createError.NotFound(Constants.EMBRYOLOGY_RECORD_NOT_FOUND);
      }

      // if (this._request.file) {
      //   //delete from s3
      //   if (existingRecord.imageLink) {
      //     const oldImageKey = `Embryology/${existingRecord.treatmentCycleId}/${existingRecord.categoryType}`;
      //     await this.deleteEmbryologyImage(oldImageKey);
      //   }

      //   // Upload the new image to S3
      //   const embryologyImageURL = await this.uploadEmbryologyImage(
      //     existingRecord.treatmentCycleId,
      //     validatedEditData.categoryType,
      //     this._request.file
      //   );

      //   validatedEditData.imageLink = embryologyImageURL;
      //   validatedEditData.treatmentCycleId = existingRecord.treatmentCycleId;
      // }

      await treatmentEmbryology.update(
        {
          categoryType: validatedEditData.categoryType,
          template: validatedEditData.template,
          imageLink: validatedEditData.imageLink || existingRecord.imageLink
        },
        {
          where: {
            id: id
          }
        }
      );

      return Constants.SUCCESS;
    } catch (err) {
      throw err;
    }
  }

  async editEmbryologyConsultationService() {
    try {
      const { id } = this._request.params;

      if (!id) {
        throw new createError.BadRequest(
          Constants.PARAMS_ERROR.replace("{params}", "id")
        );
      }

      const validatedEditData = await editEmbryologyConsultationSchema.validateAsync(
        this._request.body
      );

      const existingRecord = await consultationEmbryology.findOne({
        where: {
          id: id
        }
      });

      if (!existingRecord) {
        throw new createError.NotFound(Constants.EMBRYOLOGY_RECORD_NOT_FOUND);
      }

      // if (this._request.file) {
      //   //delete from s3
      //   if (existingRecord.imageLink) {
      //     const oldImageKey = `EmbryologyConsultation/${existingRecord.treatmentCycleId}/${existingRecord.categoryType}`;
      //     await this.deleteEmbryologyImage(oldImageKey);
      //   }

      //   // Upload the new image to S3
      //   const embryologyImageURL = await this.uploadEmbryologyImage(
      //     existingRecord.consultationId,
      //     validatedEditData.categoryType,
      //     this._request.file
      //   );

      //   validatedEditData.imageLink = embryologyImageURL;
      //   validatedEditData.consultationId = existingRecord.consultationId;
      // }

      await consultationEmbryology.update(
        {
          categoryType: validatedEditData.categoryType,
          template: validatedEditData.template,
          imageLink: validatedEditData.imageLink || existingRecord.imageLink
        },
        {
          where: {
            id: id
          }
        }
      );

      return Constants.SUCCESS;
    } catch (err) {
      throw err;
    }
  }

  // async getEmbryologyDefaultTemplateService() {
  //   const { treatmentCycleId } = this._request.params;
  //   const patientDetails = await this.mysqlConnection
  //     .query(getPatientDetailsForTemplate, {
  //       type: Sequelize.QueryTypes.SELECT,
  //       replacements: {
  //         treatmentCycleId: treatmentCycleId
  //       }
  //     })
  //     .catch(err => {
  //       console.log("Error while fetching the data for patient Details", err);
  //       throw err;
  //     });

  //   if (lodash.isEmpty(patientDetails)) {
  //     throw new createError.BadRequest(Constants.TREATMENT_NOT_FOUND);
  //   }
  //   const { patientName, patientId } = patientDetails[0];
  //   const htmlContent = await this.htmlTemplateGenerationObj.generateTemplateFromText(
  //     embryologyTemplate,
  //     { patientName, patientId }
  //   );
  //   return htmlContent;
  // }

  async getEmbryologyTemplateByIdService() {
    const { id, appointmentId, type } = this._request.query;
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
    const patientInfo = await this.mysqlConnection
      .query(getPatientInfoForTemplate, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          type: type.toLowerCase(),
          appointmentId: appointmentId
        }
      })
      .catch(err => {
        console.log("Error while fetching patient Info for template", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(patientInfo)) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    const data = await EmbryologyFormatMaster.findOne({
      where: {
        embryologyId: id
      },
      attributes: ["embryologyTemplate"]
    }).catch(err => {
      console.log("Error while fetching template", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    const hospitalLogoHeaderTemplate = await this.hospitalLogoHeaderTemplate(
      appointmentId,
      type
    );

    data.embryologyTemplate = data.embryologyTemplate
      .replace("{hospitalLogoInformation}", hospitalLogoHeaderTemplate)
      .replace("{patientName}", patientInfo[0].patientName)
      .replace("{patientId}", patientInfo[0].patientId)
      .replace("{doctorName}", patientInfo[0].doctorName)
      .replace(
        "{age}",
        patientInfo[0].age ? patientInfo[0]?.age + " Yrs" : patientInfo[0]?.age
      )
      .replace("{gender}", patientInfo[0].gender)
      .replace(
        "{spouseAge}",
        patientInfo[0]?.spouseAge
          ? patientInfo[0]?.spouseAge + " Yrs"
          : patientInfo[0]?.spouseAge
      )
      .replace("{spouseName}", patientInfo[0].spouseName);

    return data;
  }

  optimizeTemplateForSinglePage(template, categoryType) {
    // CSS for single-page optimization
    const optimizationCSS = `
      <style>
        @page {
          size: A4;
          margin: 20px 15px;
        }
        
        * {
          box-sizing: border-box;
        }
        
        
        html, body {
          font-family: Arial, Helvetica, Roboto, sans-serif;
          font-size: 10px;
          line-height: 1.15;
          margin: 0;
          padding: 0;
          width: 100%;
          height: auto;
        }
        
        body {
          padding: 5px;
        }
        
        /* Header optimization */
        img[src*="logo"], img[alt*="logo"], .logo, [class*="logo"], [id*="logo"] {
          max-height: 35px !important;
          width: auto !important;
          margin: 2px 0 !important;
        }
        
        /* Reduce header spacing */
        h1, h2, h3, h4, h5, h6 {
          margin: 3px 0 2px 0 !important;
          padding: 1px 0 !important;
          font-size: 11px !important;
          line-height: 1.2 !important;
          font-weight: bold !important;
        }
        
        /* Table optimization */
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          page-break-inside: avoid !important;
          margin: 2px 0 !important;
          font-size: 10px !important;
          table-layout: auto !important;
        }
        
        table tr {
          page-break-inside: avoid !important;
          page-break-after: auto !important;
        }
        
        table td, table th {
          padding: 3px 4px !important;
          border: 1px solid #000 !important;
          font-size: 10px !important;
          line-height: 1.1 !important;
          vertical-align: top !important;
        }
        
        table th {
          font-weight: bold !important;
          font-size: 11px !important;
          background-color: #f0f0f0 !important;
        }
        
        /* Remove excessive spacing */
        p, div {
          margin: 2px 0 !important;
          padding: 1px 0 !important;
          line-height: 1.15 !important;
        }
        
        /* Compact sections */
        .section, [class*="section"] {
          margin: 4px 0 !important;
          padding: 2px 0 !important;
        }
        
        /* Footer optimization */
        .footer, [class*="footer"], [class*="signature"] {
          margin-top: 8px !important;
          padding: 2px 0 !important;
          font-size: 10px !important;
        }
        
        /* Prevent page breaks */
        .no-break, table, tr {
          page-break-inside: avoid !important;
        }
        
        /* Reduce empty space */
        br {
          line-height: 0.5 !important;
          margin: 0 !important;
        }
        
        /* Optimize patient details section */
        .patient-details, [class*="patient"], [class*="Patient"] {
          margin: 2px 0 !important;
        }
        
        /* Compact grid layouts */
        .grid, [class*="grid"], [class*="Grid"] {
          gap: 1px !important;
        }
        
        /* Reduce spacing for common elements */
        table + table {
          margin-top: 3px !important;
        }
        
        h1 + table, h2 + table, h3 + table, h4 + table {
          margin-top: 2px !important;
        }
        
        /* Ensure content fits */
        .container, [class*="container"], [class*="Container"] {
          max-width: 100% !important;
          padding: 0 2px !important;
        }
        
        /* Optimize address blocks */
        [class*="address"], [class*="Address"] {
          margin: 2px 0 !important;
          padding: 1px 0 !important;
          font-size: 9px !important;
          line-height: 1.1 !important;
        }
        
        /* Footer optimization */
        .footer, [class*="footer"], [class*="signature"], [class*="Signature"] {
          margin-top: 5px !important;
          padding: 1px 0 !important;
          font-size: 10px !important;
        }
        
        /* Prevent page breaks in table sections */
        thead, tbody {
          page-break-inside: avoid !important;
        }
      </style>
    `;

    // Check if template already has a style tag or head tag
    let optimizedTemplate = template;

    // If template doesn't have HTML structure, wrap it
    if (!template.includes("<html") && !template.includes("<!DOCTYPE")) {
      optimizedTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${categoryType || "Report"}</title>
  ${optimizationCSS}
</head>
<body>
  ${template}
</body>
</html>`;
    } else if (template.includes("<head>")) {
      // Insert CSS before closing head tag
      optimizedTemplate = template.replace(
        "</head>",
        `${optimizationCSS}</head>`
      );
    } else if (template.includes("<html")) {
      // Add head section with CSS
      optimizedTemplate = template.replace(
        "<html",
        `<html lang="en"><head><meta charset="UTF-8">${optimizationCSS}</head>`
      );
    } else {
      // Prepend CSS at the beginning
      optimizedTemplate = optimizationCSS + template;
    }

    return optimizedTemplate;
  }

  async downloadEmbryologyService() {
    const { id, type, categoryType } = this._request.query;
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace(
          "{params}",
          "Consultation / Treatment Cycle Id"
        )
      );
    }
    if (!type) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Type Missing")
      );
    }
    if (!categoryType) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Category")
      );
    }

    let data;

    if (type == "Consultation") {
      data = await consultationEmbryology
        .findOne({
          where: {
            consultationId: id,
            categoryType: categoryType
          }
        })
        .catch(err => {
          console.log(
            "error while fetching image and template of consultation embryology",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    } else if (type == "Treatment") {
      data = await treatmentEmbryology
        .findOne({
          where: {
            treatmentCycleId: id,
            categoryType: categoryType
          }
        })
        .catch(err => {
          console.log(
            "error while fetching image and template of treatment embryology",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    }

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.EMBRYOLOGY_RECORD_NOT_FOUND);
    }

    // Optimize template for single-page layout (especially for Semen Analysis)
    const optimizedTemplate = this.optimizeTemplateForSinglePage(
      data.template,
      categoryType
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setContent(optimizedTemplate, {
      waitUntil: ["load", "domcontentloaded", "networkidle0"]
    });

    let pdf_buffer = await page.pdf({
      format: "a4",
      scale: parseFloat("1"),
      margin: { top: `20px`, bottom: `20px`, left: `15px`, right: `15px` },
      printBackground: true
    });

    await browser.close();

    this._response.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${data?.categoryType +
        ".pdf"}`,
      "Content-Length": pdf_buffer.length,
      filename: `${data?.categoryType}.pdf`
    });

    this._response.send(pdf_buffer);
  }

  async downloadEmbryologyImagesService() {
    const { id, type, categoryType } = this._request.query;
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace(
          "{params}",
          "Consultation / Treatment Cycle Id"
        )
      );
    }
    if (!type) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Type Missing")
      );
    }
    if (!categoryType) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Category")
      );
    }

    let data = null;

    if (type == "Consultation") {
      data = await this.mysqlConnection
        .query(embryologyImagesByConsultationIdAndType, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: id,
            categoryType: categoryType
          }
        })
        .catch(err => {
          console.log(
            "error while fetching images of by consultation embryology",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    } else if (type == "Treatment") {
      data = await this.mysqlConnection
        .query(embryologyImagesByTreatmentIdAndType, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: id,
            categoryType: categoryType
          }
        })
        .catch(err => {
          console.log(
            "error while fetching images of by treatment embryology",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    }

    if (lodash.isEmpty(data) || (Array.isArray(data) && data.length == 0)) {
      throw new createError.BadRequest(Constants.EMBRYOLOGY_RECORD_NOT_FOUND);
    }

    const imageLinks = data.map(row => {
      return row?.imageUrl;
    });

    const paginatedImages = [];
    for (let i = 0; i < imageLinks.length; i += 6) {
      const pageImages = imageLinks
        .slice(i, i + 6)
        .map(image => ({ url: image }));
      paginatedImages.push(pageImages);
    }

    // DYNAMIC HTML CONSTRUCTION
    const imagesTemplate = await this.htmlTemplateGenerationObj.generateTemplateFromText(
      embryologyImagesTemplate,
      { paginatedImages }
    );

    // PDF Generation
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setContent(imagesTemplate, {
      waitUntil: ["load", "domcontentloaded", "networkidle0"]
    });

    let pdf_buffer = await page.pdf({
      format: "a4",
      scale: parseFloat("1"),
      margin: { top: `0.2in`, bottom: `0.2in`, left: `0.2in`, right: `0.2in` },
      height: `11in`,
      width: `8.5in`,
      printBackground: true
    });

    await browser.close();

    this._response.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${categoryType +
        "_Images.pdf"}`,
      "Content-Length": pdf_buffer.length,
      filename: `${categoryType}_Images.pdf`
    });

    this._response.send(pdf_buffer);
  }
}

module.exports = EmbryologyService;
