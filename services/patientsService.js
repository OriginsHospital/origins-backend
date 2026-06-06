const { Sequelize, QueryTypes } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");
const Constants = require("../constants/constants");
const PatientMasterModel = require("../models/Master/patientMaster");
const {
  createPatientSchema,
  editPatientSchema,
  guardianSchema,
  createGuardianSchema,
  editGuardianSchema,
  saveOpdSheetSchema,
  saveDischargeSummarySheet,
  savePickUpSheet,
  saveFutureCycleSchema,
  referringDoctorSchema,
  updateReferringDoctorSchema
} = require("../schemas/patientSchemas");
const createError = require("http-errors");
const lodash = require("lodash");
const PatientGuardianAssociations = require("../models/Associations/patientGuardianAssociations");
const puppeteer = require("puppeteer");
const {
  getDateFilteredPatientsQuery,
  getPatientsQuery,
  getPatientInfoForDischargeSheet,
  getPatientTreatmentCYclesQuery,
  getPatientDetailsForOpdSheetQuery,
  searchPatientByAadhaarQuery,
  getFutureCyclesQuery,
  upsertFutureCycleQuery,
  patientHasStartedTreatmentQuery,
  patientActiveTreatmentTypeQuery
} = require("../queries/patient_queries");
const {
  getReferringDoctorsQuery,
  insertReferringDoctorQuery,
  updateReferringDoctorQuery,
  getReferringDoctorByIdQuery,
  insertReferringDoctorLogQuery,
  getReferringDoctorsLogQuery
} = require("../queries/referring_doctors_queries");
const {
  assertReferringDoctorsLogAccess
} = require("../constants/referringDoctorsLogAccess");

const FUTURE_CYCLE_ELIGIBLE_TREATMENT_TYPE_IDS = [1, 2, 3];
const AWSConnection = require("../connections/aws_connection");
const formFTemplate = require("../templates/formFTemplate");
const patientVisitsAssociation = require("../models/Associations/patientVisitsAssociation");
const PatientOpdSheetAssociation = require("../models/Master/patientOpdSheetAssociations");
const opdSheetTemplate = require("../templates/opdSheetTemplate");
const dischargeSummaryTemplate = require("../templates/dischargeSummarySheet");
const TreatmentDischargeSummarySheetAssociations = require("../models/Associations/treatmentDischargeSheetAssociations");
const TreatmentPickUpSheetAssociations = require("../models/Associations/treatmentPickUpSheetAssociations");
const pickUpSheetTemplate = require("../templates/pickUpSheetTemplate");
const BaseService = require("../services/baseService");

class PatientsService extends BaseService {
  constructor(request, response, next) {
    super(request, response, next);
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.s3 = AWSConnection.getS3();
    this.bucketName = AWSConnection.getS3BucketName();
  }

  getBranchCode(branchId) {
    const branchCodeMap = {
      1: "HYD",
      2: "HNK",
      3: "SPL",
      4: "KMM"
    };
    return branchCodeMap[branchId];
  }

  generateORIPatientId(id, branchId) {
    const branchCode = this.getBranchCode(branchId) || "ORI";
    const paddedId = String(id >= 0 ? id : -id).padStart(4, "0");
    return `${branchCode}${paddedId}`;
  }

  async searchPatientService() {
    const givenPatientData = this._request.params.data.trim();
    let existingPatient = await this.mysqlConnection
      .query(searchPatientByAadhaarQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          searchData: givenPatientData
        }
      })
      .catch(err => {
        console.log("Error while fetching patient info", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(existingPatient)) {
      throw new createError.BadRequest(Constants.NO_PATIENT_FOUND);
    }
    existingPatient = existingPatient[0];
    const guardianDetails = await PatientGuardianAssociations.findOne({
      where: { patientId: existingPatient.id }
    });

    let sendPatientGuardianDetails = { ...existingPatient };
    if (guardianDetails) {
      sendPatientGuardianDetails.hasGuardianInfo = true;
      sendPatientGuardianDetails.guardianDetails = guardianDetails.dataValues;
    } else {
      sendPatientGuardianDetails.hasGuardianInfo = false;
      sendPatientGuardianDetails.guardianDetails = {};
    }

    return sendPatientGuardianDetails;
  }

  async uploadPatientImage(patientId, file, type) {
    try {
      let key;

      switch (type) {
        case "patient":
          key = `patients/${patientId}`;
          break;
        case "aadhaarCard":
          // Add timestamp to ensure unique file and prevent caching issues
          const fileExtension = file.originalname.split(".").pop() || "pdf";
          key = `patients/aadhaarCard/${patientId}_${Date.now()}.${fileExtension}`;
          break;
        case "marriageCertificate":
          const marriageExtension = file.originalname.split(".").pop() || "pdf";
          key = `patients/marriageCertificate/${patientId}_${Date.now()}.${marriageExtension}`;
          break;
        case "affidavit":
          const affidavitExtension =
            file.originalname.split(".").pop() || "pdf";
          key = `patients/affidavit/${patientId}_${Date.now()}.${affidavitExtension}`;
          break;
        default:
          throw new createError.BadRequest("Invalid file type");
      }
      console.log(`Uploading ${type} to S3 with key:`, key);

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      };
      const uploadResult = await this.s3.upload(uploadParams).promise();
      console.log(
        `Successfully uploaded ${type} to S3. URL:`,
        uploadResult.Location
      );
      return uploadResult.Location;
    } catch (error) {
      console.error(`Error uploading patient ${type} image to S3:`, error);
      throw createError.InternalServerError(Constants.SOMETHING_ERROR_OCCURRED);
    }
  }

  async uploadDocumentToS3(patientId, file) {
    const uniqueFileName = `${Date.now()}_${file.originalname}`;
    const key = `patients/${patientId}/uploadedDocuments/${uniqueFileName}`;
    const uploadParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    const uploadResult = await this.s3.upload(uploadParams).promise();
    return uploadResult.Location;
  }

  async createPatientService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedData = await createPatientSchema.validateAsync(
      this._request.body
    );
    validatedData.createdBy = createdByUserId;

    const existingPatient = await PatientMasterModel.findOne({
      where: {
        [Sequelize.Op.or]: [
          { aadhaarNo: validatedData.aadhaarNo },
          { mobileNo: validatedData.mobileNo }
        ]
      }
    });

    if (existingPatient) {
      throw new createError.BadRequest(Constants.CREATE_PATIENT_CONFLICT);
    }

    return await this.mysqlConnection.transaction(async t => {
      const newPatientRecord = await PatientMasterModel.create(validatedData, {
        transaction: t
      }).catch(err => {
        console.log("Error while creating new patient", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
      const newPatient = newPatientRecord.dataValues;

      const newPatientId = this.generateORIPatientId(
        newPatient.id,
        newPatient.branchId
      );
      await PatientMasterModel.update(
        { patientId: newPatientId },
        { where: { id: newPatient.id }, transaction: t }
      ).catch(err => {
        console.log("Error while adding patientId", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
      //Image upload to S3
      if (this._request.files && this._request.files.file) {
        const patientImageURL = await this.uploadPatientImage(
          newPatient.id,
          this._request.files.file[0],
          "patient"
        );
        await PatientMasterModel.update(
          { photoPath: patientImageURL },
          { where: { id: newPatient.id }, transaction: t }
        ).catch(err => {
          console.log("Error while updating patient photo path", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
        newPatient.photoPath = patientImageURL;
      }

      //aadhaarCard
      if (this._request.files && this._request.files.aadhaarCard) {
        const patientAadhaarImageURL = await this.uploadPatientImage(
          newPatient.id,
          this._request.files.aadhaarCard[0],
          "aadhaarCard"
        );
        await PatientMasterModel.update(
          { aadhaarCard: patientAadhaarImageURL },
          { where: { id: newPatient.id }, transaction: t }
        ).catch(err => {
          console.log(
            "Error while updating patient aadhaarCard photo path",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
        newPatient.aadhaarCard = patientAadhaarImageURL;
      }

      //marriageCertificate
      if (this._request.files && this._request.files.marriageCertificate) {
        const patientMarriageCertImageURL = await this.uploadPatientImage(
          newPatient.id,
          this._request.files.marriageCertificate[0],
          "marriageCertificate"
        );
        await PatientMasterModel.update(
          { marriageCertificate: patientMarriageCertImageURL },
          { where: { id: newPatient.id }, transaction: t }
        ).catch(err => {
          console.log(
            "Error while updating patient marriageCertificate photo path",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
        newPatient.marriageCertificate = patientMarriageCertImageURL;
      }

      //affidavit
      if (this._request.files && this._request.files.affidavit) {
        const patientAfidavitImageURL = await this.uploadPatientImage(
          newPatient.id,
          this._request.files.affidavit[0],
          "affidavit"
        );
        await PatientMasterModel.update(
          { affidavit: patientAfidavitImageURL },
          { where: { id: newPatient.id }, transaction: t }
        ).catch(err => {
          console.log("Error while updating patient affidavit photo path", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
        newPatient.affidavit = patientAfidavitImageURL;
      }

      if (this._request.files && this._request.files.uploadedDocuments) {
        const uploadedDocuments = this._request.files.uploadedDocuments;
        const documentUploadPromises = uploadedDocuments.map(doc =>
          this.uploadDocumentToS3(newPatient.id, doc)
        );
        const documentPaths = await Promise.all(documentUploadPromises);

        await PatientMasterModel.update(
          { uploadedDocuments: documentPaths },
          { where: { id: newPatient.id }, transaction: t }
        ).catch(err => {
          console.log("Error while updating uploaded documents", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
        newPatient.uploadedDocuments = documentPaths;
      }

      let guardianDetails = null;
      if (validatedData.hasGuardianInfo) {
        validatedData.guardianDetails = JSON.parse(
          validatedData.guardianDetails
        );
        const validatedGuardianData = await guardianSchema.validateAsync(
          validatedData.guardianDetails
        );
        const guardianData = {
          patientId: newPatient.id,
          name: validatedGuardianData.name,
          age: validatedGuardianData.age,
          gender: "male",
          relation: "Spouse",
          email: validatedGuardianData.email,
          aadhaarNo: validatedGuardianData.aadhaarNo,
          bloodGroup: validatedGuardianData?.bloodGroup,
          additionalDetails: validatedGuardianData.additionalDetails
        };

        guardianDetails = await PatientGuardianAssociations.create(
          guardianData,
          { transaction: t }
        ).catch(err => {
          console.log("Error while adding guardian details", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      }

      if (validatedData.createActiveVisit) {
        const createVisitData = {
          isActive: 1,
          patientId: newPatient.id,
          type: newPatient.patientTypeId,
          visitDate: new Date().toISOString().split("T")[0]
        };
        await patientVisitsAssociation
          .create(createVisitData, { transaction: t })
          .catch(err => {
            console.log("Error while creating automatic visit", err.message);
            throw new createError.InternalServerError(
              Constants.SOMETHING_ERROR_OCCURRED
            );
          });
      }
      return { ...newPatient, guardianDetails: guardianDetails };
    });
  }

  async createGuardianService() {
    const validatedGuardianData = await createGuardianSchema.validateAsync(
      this._request.body
    );

    validatedGuardianData.gender = "male";

    const existingGuardian = await PatientGuardianAssociations.findOne({
      where: {
        patientId: validatedGuardianData.patientId
      }
    }).catch(err => {
      console.log("Error while creating guardian", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (existingGuardian) {
      throw new createError.BadRequest(Constants.CREATE_GUARDIAN_CONFLICT);
    }

    const newGuardianData = await PatientGuardianAssociations.create(
      validatedGuardianData
    ).catch(err => {
      console.log("Error while creating new guardian", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return newGuardianData;
  }

  async getPatientsService() {
    const { searchQuery } = this._request.query;
    const trimmedSearchQuery = searchQuery?.trim();

    let query = getPatientsQuery;
    if (trimmedSearchQuery) {
      query += `
        WHERE 
          base.mobileNo LIKE :searchQuery OR 
          base.patientId LIKE :searchQuery OR
          base.Name LIKE :searchQuery OR 
          base.aadhaarNo LIKE :searchQuery
      `;
    }
    query += ` ORDER BY base.createdAt DESC `;

    const patientsData = await this.mysqlConnection
      .query(query, {
        replacements: { searchQuery: `%${trimmedSearchQuery}%` },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting patients data", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return patientsData;
  }

  async getDateFilteredPatientsService() {
    const { fromDate, toDate } = this._request.query;
    const getDateFilteredPatients = await this.mysqlConnection
      .query(getDateFilteredPatientsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          fromDate: fromDate,
          toDate: toDate
        }
      })
      .catch(err => {
        console.log("Error while getting Date Filtered Patients", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return getDateFilteredPatients;
  }

  async getPatientDetailsService() {
    const patientParamId = this._request.params.id;
    const getAskedPatientData = await PatientMasterModel.findOne({
      where: { id: patientParamId }
    }).catch(err => {
      console.log("Error while getting patient Details", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return getAskedPatientData.dataValues;
  }

  async editPatientService() {
    const createdByUserId = this._request?.userDetails?.id;

    // Log incoming request body for debugging
    console.log(
      "Edit Patient Request Body:",
      JSON.stringify(this._request.body, null, 2)
    );

    // Only include fields that are in the edit schema to prevent validation errors
    const allowedFields = [
      "id",
      "branchId",
      "aadhaarNo",
      "mobileNo",
      "email",
      "firstName",
      "lastName",
      "gender",
      "maritalStatus",
      "dateOfBirth",
      "bloodGroup",
      "addressLine1",
      "addressLine2",
      "patientTypeId",
      "cityId",
      "stateId",
      "referralId",
      "referralName",
      "pincode",
      "photoPath"
    ];

    // Filter out any fields not in the allowed list (like isZeroRegistration, createActiveVisit, etc.)
    // Use safer property check that works with FormData/multer body objects
    const bodyData = {};
    const requestBody = this._request.body || {};

    allowedFields.forEach(field => {
      if (field in requestBody && requestBody[field] !== undefined) {
        bodyData[field] = requestBody[field];
      }
    });
    if (bodyData.id) bodyData.id = Number(bodyData.id);
    if (bodyData.branchId) bodyData.branchId = Number(bodyData.branchId);
    if (bodyData.patientTypeId)
      bodyData.patientTypeId = Number(bodyData.patientTypeId);
    if (bodyData.cityId && bodyData.cityId !== "")
      bodyData.cityId = Number(bodyData.cityId);
    if (bodyData.stateId && bodyData.stateId !== "")
      bodyData.stateId = Number(bodyData.stateId);
    if (bodyData.referralId && bodyData.referralId !== "")
      bodyData.referralId = Number(bodyData.referralId);

    // Convert empty strings to null for optional fields
    if (bodyData.email === "") bodyData.email = null;
    if (bodyData.lastName === "") bodyData.lastName = null;
    if (bodyData.gender === "") bodyData.gender = null;
    if (bodyData.bloodGroup === "") bodyData.bloodGroup = null;
    if (bodyData.addressLine1 === "") bodyData.addressLine1 = null;
    if (bodyData.addressLine2 === "") bodyData.addressLine2 = null;
    if (bodyData.referralName === "") bodyData.referralName = null;
    if (bodyData.pincode === "") bodyData.pincode = null;
    if (bodyData.cityId === "") bodyData.cityId = null;
    if (bodyData.stateId === "") bodyData.stateId = null;
    if (bodyData.referralId === "") bodyData.referralId = null;

    // Handle dateOfBirth conversion - convert string to Date or null
    if (
      bodyData.dateOfBirth === "" ||
      bodyData.dateOfBirth === null ||
      bodyData.dateOfBirth === undefined
    ) {
      bodyData.dateOfBirth = null;
    } else if (
      typeof bodyData.dateOfBirth === "string" &&
      bodyData.dateOfBirth.trim() !== ""
    ) {
      // Convert string date to Date object for Sequelize
      const dateObj = new Date(bodyData.dateOfBirth);
      if (isNaN(dateObj.getTime())) {
        // Invalid date string, set to null
        bodyData.dateOfBirth = null;
      } else {
        bodyData.dateOfBirth = dateObj;
      }
    }

    // Ensure gender is not null (model requires it, but schema allows null)
    // Default to 'Female' if null or empty
    if (
      !bodyData.gender ||
      bodyData.gender === "" ||
      bodyData.gender === null
    ) {
      bodyData.gender = "Female";
    }

    const validatedEditData = await editPatientSchema
      .validateAsync(bodyData)
      .catch(err => {
        console.log("Validation Error:", err.message);
        console.log("Validation Details:", err.details);
        throw new createError.BadRequest(err.message || "Validation failed");
      });

    console.log(
      "Validated Edit Data:",
      JSON.stringify(validatedEditData, null, 2)
    );

    const isExistedPatient = await PatientMasterModel.findOne({
      where: { id: validatedEditData.id }
    }).catch(err => {
      console.log("Error while getting existing patient Details", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!isExistedPatient) {
      throw new createError.BadRequest(Constants.PATIENT_DOES_NOT_EXIST);
    }

    const isAadhaarExists = await PatientMasterModel.findOne({
      where: {
        [Sequelize.Op.or]: [
          { aadhaarNo: validatedEditData.aadhaarNo },
          { mobileNo: validatedEditData.mobileNo }
        ],
        id: { [Sequelize.Op.ne]: validatedEditData.id }
      }
    });

    if (!lodash.isEmpty(isAadhaarExists)) {
      throw new createError.Conflict(Constants.CREATE_PATIENT_CONFLICT);
    }

    // Prepare update data object - only include fields that should be updated
    const updateData = {
      branchId: validatedEditData.branchId,
      aadhaarNo: validatedEditData.aadhaarNo,
      mobileNo: validatedEditData.mobileNo,
      email: validatedEditData.email,
      firstName: validatedEditData.firstName,
      lastName: validatedEditData.lastName,
      gender: validatedEditData.gender,
      maritalStatus: validatedEditData.maritalStatus,
      dateOfBirth: validatedEditData.dateOfBirth,
      bloodGroup: validatedEditData.bloodGroup,
      addressLine1: validatedEditData.addressLine1,
      addressLine2: validatedEditData.addressLine2,
      patientTypeId: validatedEditData.patientTypeId,
      cityId: validatedEditData.cityId,
      stateId: validatedEditData.stateId,
      referralId: validatedEditData.referralId,
      referralName: validatedEditData.referralName,
      pincode: validatedEditData.pincode,
      updatedBy: createdByUserId
    };

    // Handle file uploads - only update if new files are provided
    if (this._request.files && this._request.files.file) {
      const uploadedPhotoPath = await this.uploadPatientImage(
        isExistedPatient.dataValues.id,
        this._request.files.file[0],
        "patient"
      );
      updateData.photoPath = uploadedPhotoPath;
    }

    //aadhaarCard
    if (this._request.files && this._request.files.aadhaarCard) {
      console.log(
        "Uploading new Aadhaar card file for patient ID:",
        isExistedPatient.dataValues.id
      );
      console.log("File details:", {
        originalname: this._request.files.aadhaarCard[0].originalname,
        mimetype: this._request.files.aadhaarCard[0].mimetype,
        size: this._request.files.aadhaarCard[0].size
      });
      const uploadedAadhaar = await this.uploadPatientImage(
        isExistedPatient.dataValues.id,
        this._request.files.aadhaarCard[0],
        "aadhaarCard"
      );
      console.log(
        "Aadhaar card uploaded successfully. New URL:",
        uploadedAadhaar
      );
      updateData.aadhaarCard = uploadedAadhaar;
    }

    //marriageCertificate
    if (this._request.files && this._request.files.marriageCertificate) {
      const uploadedMarriageCertificate = await this.uploadPatientImage(
        isExistedPatient.dataValues.id,
        this._request.files.marriageCertificate[0],
        "marriageCertificate"
      );
      updateData.marriageCertificate = uploadedMarriageCertificate;
    }

    //affidavit
    if (this._request.files && this._request.files.affidavit) {
      const uploadedAffidavit = await this.uploadPatientImage(
        isExistedPatient.dataValues.id,
        this._request.files.affidavit[0],
        "affidavit"
      );
      updateData.affidavit = uploadedAffidavit;
    }

    // Handle uploaded documents
    if (this._request.files && this._request.files.uploadedDocuments) {
      const uploadedDocuments = this._request.files.uploadedDocuments;
      const documentUploadPromises = uploadedDocuments.map(doc =>
        this.uploadDocumentToS3(isExistedPatient.dataValues.id, doc)
      );
      const documentPaths = await Promise.all(documentUploadPromises);
      const existingDocuments = Array.isArray(
        isExistedPatient.dataValues.uploadedDocuments
      )
        ? isExistedPatient.dataValues.uploadedDocuments
        : [];
      updateData.uploadedDocuments = [...existingDocuments, ...documentPaths];
    }

    console.log("Update Data:", JSON.stringify(updateData, null, 2));
    console.log("Updating patient with ID:", isExistedPatient.dataValues.id);
    console.log(
      "Current aadhaarCard before update:",
      isExistedPatient.dataValues.aadhaarCard
    );

    const updateResult = await PatientMasterModel.update(updateData, {
      where: { id: isExistedPatient.dataValues.id }
    }).catch(err => {
      console.log("Error while updating existing patient Details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    console.log("Update Result:", updateResult);
    console.log("Rows affected:", updateResult[0]);

    if (updateResult[0] === 0) {
      console.log("WARNING: No rows were updated!");
      throw new createError.InternalServerError(
        "Failed to update patient record. No rows were affected."
      );
    }

    // Fetch and return the updated patient data
    // Use raw: true and force a fresh query to avoid Sequelize caching
    const updatedPatient = await PatientMasterModel.findOne({
      where: { id: isExistedPatient.dataValues.id },
      raw: false // Keep as false to get full model instance
    }).catch(err => {
      console.log("Error while fetching updated patient Details", err.message);
      // Even if fetch fails, return the existing patient data we had before update
      // This ensures the frontend gets some data to work with
      return isExistedPatient;
    });

    // Log the fetched data to verify the update
    if (updatedPatient) {
      console.log(
        "Fetched updated patient aadhaarCard:",
        updatedPatient.dataValues.aadhaarCard
      );
      console.log(
        "Fetched updated patient data:",
        JSON.stringify(
          {
            id: updatedPatient.dataValues.id,
            aadhaarCard: updatedPatient.dataValues.aadhaarCard,
            marriageCertificate: updatedPatient.dataValues.marriageCertificate,
            affidavit: updatedPatient.dataValues.affidavit
          },
          null,
          2
        )
      );

      // Always return patient data (either updated or existing)
      // This allows frontend to immediately update UI without refetching
      return updatedPatient.dataValues;
    }

    // Fallback: return existing patient data if fetch somehow failed
    console.log(
      "WARNING: Could not fetch updated patient, returning existing data"
    );
    return isExistedPatient.dataValues;
  }

  async editGuardianService() {
    const validatedEditGuardianData = await editGuardianSchema.validateAsync(
      this._request.body
    );

    const isExistedGuardian = await PatientGuardianAssociations.findOne({
      where: {
        id: validatedEditGuardianData.id
      }
    }).catch(err => {
      console.log("Error while getting existing guardian Details", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!isExistedGuardian) {
      throw new createError.BadRequest(Constants.GUARDIAN_DOES_NOT_EXIST);
    }
    (validatedEditGuardianData.relation = "Spouse"),
      (validatedEditGuardianData.gender = "male"),
      await PatientGuardianAssociations.update(validatedEditGuardianData, {
        where: {
          id: validatedEditGuardianData.id,
          patientId: validatedEditGuardianData.patientId
        }
      }).catch(err => {
        console.log("Error while updating existing guardian Details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return Constants.DATA_UPDATED_SUCCESS;
  }

  async deletePatientService() {}

  async getFormFTemplateService() {
    return formFTemplate;
  }

  async getOpdSheetByPatientIdService() {
    const { id } = this._request.params;
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{{params}}", "patientId")
      );
    }

    let data = await PatientOpdSheetAssociation.findOne({
      where: {
        patientId: id
      },
      attributes: ["patientId", "template"]
    }).catch(err => {
      console.log("Error while getting opd sheet", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      // Sending the default Template
      let defaultOpdTemplate = opdSheetTemplate;

      const hospitalLogoHeaderTemplate = await this.hospitalLogoHeaderTemplateUsingPatientId(
        id
      );

      const patientInfo = await this.mysqlConnection
        .query(getPatientDetailsForOpdSheetQuery, {
          type: QueryTypes.SELECT,
          replacements: {
            patientId: id
          }
        })
        .catch(err => {
          console.log("Error during fetching of patientDetails", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (lodash.isEmpty(patientInfo)) {
        throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
      }

      defaultOpdTemplate = defaultOpdTemplate
        .replaceAll(
          "{patientName}",
          patientInfo[0]?.patientDetails?.patientName
        )
        .replaceAll("{date}", patientInfo[0]?.patientDetails?.date)
        .replaceAll("{age}", patientInfo[0]?.patientDetails?.age)
        .replaceAll("{height}", patientInfo[0]?.patientDetails?.height || "")
        .replaceAll("{weight}", patientInfo[0]?.patientDetails?.weight || "")
        .replaceAll("{bmi}", patientInfo[0]?.patientDetails?.bmi || "")
        .replaceAll(
          "{maritalStatus}",
          patientInfo[0]?.patientDetails?.maritalStatus
        )
        .replaceAll(
          "{spouseBmiInformation}",
          patientInfo[0]?.patientDetails?.spouseBmiInformation || ""
        )
        .replaceAll("{hospitalLogoInformation}", hospitalLogoHeaderTemplate)
        .replaceAll("{spouseName}", patientInfo[0]?.patientDetails?.spouseName);

      data = {
        patientId: id,
        template: defaultOpdTemplate
      };
    }

    return data;
  }

  async saveOpdSheetService() {
    const { patientId, template } = await saveOpdSheetSchema.validateAsync(
      this._request.body
    );

    const data = await PatientOpdSheetAssociation.findOne({
      where: {
        patientId: patientId
      }
    }).catch(err => {
      console.log("Error while getting opd sheet details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      await PatientOpdSheetAssociation.create({
        patientId,
        template
      }).catch(err => {
        console.log("Error while creating patient Opd Sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    } else {
      await PatientOpdSheetAssociation.update(
        {
          template
        },
        {
          where: {
            patientId: patientId
          }
        }
      ).catch(err => {
        console.log("Error while updating patient Opd Sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getDischargeSummarySheetByTreatmentIdService() {
    const { id } = this._request.params;
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{{params}}", "TreatmentCycle Id")
      );
    }

    let data = await TreatmentDischargeSummarySheetAssociations.findOne({
      where: {
        treatmentCycleId: id
      },
      attributes: ["treatmentCycleId", "template"]
    }).catch(err => {
      console.log("Error while getting discharge Summary sheet", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      // Sending the default Template
      let defaultDischargeTemplate = dischargeSummaryTemplate;
      const patientInfo = await this.mysqlConnection
        .query(getPatientInfoForDischargeSheet, {
          type: QueryTypes.SELECT,
          replacements: {
            treatmentCycleId: id
          }
        })
        .catch(err => {
          console.log("Error during fetching of patientDetails", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (lodash.isEmpty(patientInfo)) {
        throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
      }

      defaultDischargeTemplate = defaultDischargeTemplate
        .replaceAll("{{patientName}}", patientInfo[0].patientName)
        .replaceAll("{{husbandName}}", patientInfo[0].husbandName)
        .replaceAll("{{husbandAge}}", patientInfo[0].husbandAge)
        .replaceAll("{{patientAge}}", patientInfo[0].patientAge);

      data = {
        treatmentCycleId: id,
        template: defaultDischargeTemplate
      };
    }
    return data;
  }

  async saveDischargeSummarySheetService() {
    const {
      treatmentCycleId,
      template
    } = await saveDischargeSummarySheet.validateAsync(this._request.body);

    const data = await TreatmentDischargeSummarySheetAssociations.findOne({
      where: {
        treatmentCycleId: treatmentCycleId
      }
    }).catch(err => {
      console.log("Error while getting discharge sheet details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      await TreatmentDischargeSummarySheetAssociations.create({
        treatmentCycleId,
        template
      }).catch(err => {
        console.log("Error while creating patient discharge Sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    } else {
      await TreatmentDischargeSummarySheetAssociations.update(
        {
          template
        },
        {
          where: {
            treatmentCycleId: treatmentCycleId
          }
        }
      ).catch(err => {
        console.log("Error while updating patient discharge  Sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async uploadDischargeSummaryImageService() {
    const { id } = this._request.params;
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{{params}}", "TreatmentCycle Id")
      );
    }

    const files = this._request.files;
    if (!files || files.length === 0) {
      throw new createError.BadRequest("Image file is required");
    }

    const file = files[0];
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp"
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new createError.BadRequest(
        "Only image files (JPEG, PNG, GIF, WEBP) are allowed"
      );
    }

    try {
      const baseName =
        file.originalname?.split(".")[0]?.replace(/\s+/g, "_") || "image";
      const extension = file.originalname?.split(".").pop() || "png";
      const uniqueFileName = `${baseName}_${Date.now()}`;
      const key = `DischargeSummary/${id}/${uniqueFileName}.${extension}`;

      const uploadResult = await this.s3
        .upload({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype
        })
        .promise();

      return {
        files: [uploadResult.Location],
        baseurl: "",
        path: uploadResult.Location,
        isImages: [true]
      };
    } catch (err) {
      console.log("Error while uploading discharge summary image", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async getPickUpSheetByTreatmentIdService() {
    const { id } = this._request.params;
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{{params}}", "TreatmentCycle Id")
      );
    }

    let data = await TreatmentPickUpSheetAssociations.findOne({
      where: {
        treatmentCycleId: id
      },
      attributes: ["treatmentCycleId", "template"]
    }).catch(err => {
      console.log("Error while getting pickUp sheet", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      // Sending the default Template
      let defaultPickUpSheet = pickUpSheetTemplate;
      const patientInfo = await this.mysqlConnection
        .query(getPatientInfoForDischargeSheet, {
          type: QueryTypes.SELECT,
          replacements: {
            treatmentCycleId: id
          }
        })
        .catch(err => {
          console.log("Error during fetching of patientDetails", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (lodash.isEmpty(patientInfo)) {
        throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
      }

      defaultPickUpSheet = defaultPickUpSheet
        .replaceAll("{{patientName}}", patientInfo[0].patientName)
        .replaceAll("{{patientAge}}", patientInfo[0].patientAge);

      data = {
        treatmentCycleId: id,
        template: defaultPickUpSheet
      };
    }
    return data;
  }

  async savePickUpSheetService() {
    const { treatmentCycleId, template } = await savePickUpSheet.validateAsync(
      this._request.body
    );

    const data = await TreatmentPickUpSheetAssociations.findOne({
      where: {
        treatmentCycleId: treatmentCycleId
      }
    }).catch(err => {
      console.log("Error while getting pickup sheet details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      await TreatmentPickUpSheetAssociations.create({
        treatmentCycleId,
        template
      }).catch(err => {
        console.log("Error while creating patient pickup Sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    } else {
      await TreatmentPickUpSheetAssociations.update(
        {
          template
        },
        {
          where: {
            treatmentCycleId: treatmentCycleId
          }
        }
      ).catch(err => {
        console.log("Error while updating patient pickup  Sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getPatientTreatmentCyclesService() {
    const { searchQuery } = this._request.query;
    const trimmedSearchQuery = searchQuery?.trim();

    let query = getPatientTreatmentCYclesQuery;
    if (trimmedSearchQuery) {
      query += `
        AND ( 
          pm.mobileNo LIKE :searchQuery OR 
          pm.patientId LIKE :searchQuery OR
          pm.firstName LIKE :searchQuery OR 
          pm.lastName LIKE :searchQuery OR 
          CONCAT(pm.lastName, ' ', pm.firstName) LIKE :searchQuery OR 
          pm.aadhaarNo LIKE :searchQuery
    )
      `;
    }

    const patientsTreatmentCyclesData = await this.mysqlConnection
      .query(query, {
        replacements: { searchQuery: `%${trimmedSearchQuery}%` },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log(
          "Error while getting patients treatmentCycles data",
          err.message
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return patientsTreatmentCyclesData;
  }

  async saveFutureCycleService() {
    const { error, value } = saveFutureCycleSchema.validate(
      this._request.body,
      {
        convert: true
      }
    );
    if (error) {
      throw new createError.BadRequest(error.details[0].message);
    }

    let patient = await PatientMasterModel.findByPk(value.patientId).catch(
      () => null
    );
    if (!patient) {
      patient = await PatientMasterModel.findOne({
        where: { patientId: String(value.patientId) }
      }).catch(() => null);
    }
    if (!patient) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    const patientMasterId = patient.id;

    const treatmentCheck = await this.mysqlConnection
      .query(patientHasStartedTreatmentQuery, {
        replacements: { patientId: patientMasterId },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error checking patient treatment status", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (Number(treatmentCheck[0]?.hasStartedTreatment) === 1) {
      const activeTreatmentRows = await this.mysqlConnection
        .query(patientActiveTreatmentTypeQuery, {
          replacements: { patientId: patientMasterId },
          type: Sequelize.QueryTypes.SELECT
        })
        .catch(err => {
          console.log("Error fetching active treatment type", err.message);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      const activeTreatmentTypeId = Number(
        activeTreatmentRows[0]?.treatmentTypeId
      );

      if (
        !FUTURE_CYCLE_ELIGIBLE_TREATMENT_TYPE_IDS.includes(
          activeTreatmentTypeId
        )
      ) {
        throw new createError.BadRequest(
          "Future cycle is only available for OI + TI, IUI Self, and IUI Donor patients, or before treatment has started."
        );
      }
    }

    const userId = this._request.userDetails?.id || null;

    await this.mysqlConnection
      .query(upsertFutureCycleQuery, {
        replacements: {
          patientId: patientMasterId,
          cycleMonth: value.cycleMonth,
          cycleYear: value.cycleYear,
          createdBy: userId
        }
      })
      .catch(err => {
        console.log("Error while saving future cycle", err.message);
        if (err.message && err.message.includes("patient_future_cycles")) {
          throw new createError.InternalServerError(
            "Future cycles table is missing. Please run database migration 038_create_patient_future_cycles.sql"
          );
        }
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getFutureCyclesService() {
    const { branchId, cycleMonth, cycleYear } = this._request.query;

    let query = getFutureCyclesQuery;
    const replacements = {};

    if (branchId) {
      query += ` AND pm.branchId = :branchId`;
      replacements.branchId = branchId;
    }
    if (cycleMonth) {
      query += ` AND pfc.cycleMonth = :cycleMonth`;
      replacements.cycleMonth = parseInt(cycleMonth, 10);
    }
    if (cycleYear) {
      query += ` AND pfc.cycleYear = :cycleYear`;
      replacements.cycleYear = parseInt(cycleYear, 10);
    }

    query += `
      ORDER BY
        CASE
          WHEN STR_TO_DATE(CONCAT(pfc.cycleYear, '-', LPAD(pfc.cycleMonth, 2, '0'), '-01'), '%Y-%m-%d') >= CURDATE()
          THEN 0
          ELSE 1
        END,
        STR_TO_DATE(CONCAT(pfc.cycleYear, '-', LPAD(pfc.cycleMonth, 2, '0'), '-01'), '%Y-%m-%d') ASC
    `;

    const futureCyclesData = await this.mysqlConnection
      .query(query, {
        replacements,
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting future cycles data", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return futureCyclesData;
  }

  _normalizeDoctorName(name) {
    return String(name || "")
      .trim()
      .replace(/^dr\.?\s*/i, "");
  }

  _formatDoctorRecord(record) {
    return [
      `Name: Dr. ${record.doctorName}`,
      `Specialization: ${record.specialization}`,
      `Branch ID: ${record.branchId}`,
      `Area/Village: ${record.areaVillage}`,
      `Contact: ${record.contactNumber}`,
      `Hospital: ${record.hospitalName}`,
      `Status: ${Number(record.isActive) === 1 ? "Active" : "Inactive"}`
    ].join("; ");
  }

  _getFieldChanges(oldRecord, newRecord) {
    const fields = [
      { key: "doctorName", label: "Doctor Name", format: v => `Dr. ${v}` },
      { key: "specialization", label: "Specialization" },
      { key: "branchId", label: "Branch ID" },
      { key: "areaVillage", label: "Area/Village" },
      { key: "contactNumber", label: "Contact Number" },
      { key: "hospitalName", label: "Hospital Name" },
      {
        key: "isActive",
        label: "Status",
        format: v => (Number(v) === 1 ? "Active" : "Inactive")
      }
    ];

    const previousParts = [];
    const updatedParts = [];

    fields.forEach(({ key, label, format }) => {
      const oldVal = oldRecord[key];
      const newVal = newRecord[key];
      if (String(oldVal) !== String(newVal)) {
        const fmt = format || (v => v);
        previousParts.push(`${label}: ${fmt(oldVal)}`);
        updatedParts.push(`${label}: ${fmt(newVal)}`);
      }
    });

    return { previousParts, updatedParts };
  }

  async _logReferringDoctorActivity({
    referringDoctorId,
    doctorName,
    action,
    previousValue,
    updatedValue
  }) {
    const userId = this._request.userDetails?.id;
    if (!userId || !referringDoctorId) {
      console.log(
        "Skipping referring doctor log entry",
        JSON.stringify({ userId, referringDoctorId, action })
      );
      return;
    }

    await this.mysqlConnection
      .query(insertReferringDoctorLogQuery, {
        replacements: {
          referringDoctorId,
          doctorName,
          action,
          previousValue: previousValue || null,
          updatedValue: updatedValue || null,
          performedBy: userId
        },
        type: Sequelize.QueryTypes.INSERT
      })
      .catch(err => {
        console.log(
          "Error while logging referring doctor activity",
          err.message
        );
      });
  }

  async createReferringDoctorService() {
    const { error, value } = referringDoctorSchema.validate(
      this._request.body,
      { convert: true }
    );
    if (error) {
      throw new createError.BadRequest(error.details[0].message);
    }

    const userId = this._request.userDetails?.id || null;
    const doctorName = this._normalizeDoctorName(value.doctorName);

    const [insertId] = await this.mysqlConnection
      .query(insertReferringDoctorQuery, {
        replacements: {
          doctorName,
          specialization: value.specialization,
          branchId: value.branchId,
          areaVillage: value.areaVillage,
          contactNumber: value.contactNumber,
          hospitalName: value.hospitalName,
          isActive: value.isActive ?? 1,
          userId
        },
        type: Sequelize.QueryTypes.INSERT
      })
      .catch(err => {
        console.log("Error while creating referring doctor", err.message);
        if (err.message && err.message.includes("referring_doctors")) {
          throw new createError.InternalServerError(
            "Referring doctors table is missing. Please run database migration 041_create_referring_doctors.sql"
          );
        }
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    const record = {
      doctorName,
      specialization: value.specialization,
      branchId: value.branchId,
      areaVillage: value.areaVillage,
      contactNumber: value.contactNumber,
      hospitalName: value.hospitalName,
      isActive: value.isActive ?? 1
    };

    await this._logReferringDoctorActivity({
      referringDoctorId: insertId,
      doctorName,
      action: "Created",
      previousValue: "-",
      updatedValue: this._formatDoctorRecord(record)
    });

    return Constants.SUCCESS;
  }

  async updateReferringDoctorService() {
    const { error, value } = updateReferringDoctorSchema.validate(
      this._request.body,
      { convert: true }
    );
    if (error) {
      throw new createError.BadRequest(error.details[0].message);
    }

    const existingRows = await this.mysqlConnection
      .query(getReferringDoctorByIdQuery, {
        replacements: { id: value.id },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error fetching referring doctor", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!existingRows.length) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    const existing = existingRows[0];
    const userId = this._request.userDetails?.id || null;
    const doctorName = this._normalizeDoctorName(value.doctorName);

    const newRecord = {
      doctorName,
      specialization: value.specialization,
      branchId: value.branchId,
      areaVillage: value.areaVillage,
      contactNumber: value.contactNumber,
      hospitalName: value.hospitalName,
      isActive: value.isActive
    };

    await this.mysqlConnection
      .query(updateReferringDoctorQuery, {
        replacements: { ...newRecord, id: value.id, userId }
      })
      .catch(err => {
        console.log("Error while updating referring doctor", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    const statusChanged =
      Number(existing.isActive) !== Number(newRecord.isActive);
    const onlyStatusChanged =
      statusChanged &&
      existing.doctorName === newRecord.doctorName &&
      existing.specialization === newRecord.specialization &&
      Number(existing.branchId) === Number(newRecord.branchId) &&
      existing.areaVillage === newRecord.areaVillage &&
      existing.contactNumber === newRecord.contactNumber &&
      existing.hospitalName === newRecord.hospitalName;

    if (onlyStatusChanged) {
      await this._logReferringDoctorActivity({
        referringDoctorId: value.id,
        doctorName,
        action: Number(newRecord.isActive) === 1 ? "Activated" : "Deactivated",
        previousValue: Number(existing.isActive) === 1 ? "Active" : "Inactive",
        updatedValue: Number(newRecord.isActive) === 1 ? "Active" : "Inactive"
      });
    } else {
      const { previousParts, updatedParts } = this._getFieldChanges(
        existing,
        newRecord
      );

      if (previousParts.length > 0) {
        await this._logReferringDoctorActivity({
          referringDoctorId: value.id,
          doctorName,
          action: "Updated",
          previousValue: previousParts.join("; "),
          updatedValue: updatedParts.join("; ")
        });
      }

      if (statusChanged && !onlyStatusChanged) {
        await this._logReferringDoctorActivity({
          referringDoctorId: value.id,
          doctorName,
          action:
            Number(newRecord.isActive) === 1 ? "Activated" : "Deactivated",
          previousValue:
            Number(existing.isActive) === 1 ? "Active" : "Inactive",
          updatedValue: Number(newRecord.isActive) === 1 ? "Active" : "Inactive"
        });
      }
    }

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getReferringDoctorsService() {
    const {
      doctorName,
      specialization,
      branchId,
      areaVillage,
      contactNumber,
      hospitalName,
      status
    } = this._request.query;

    let query = getReferringDoctorsQuery;
    const replacements = {};

    if (doctorName) {
      query += ` AND rd.doctorName LIKE :doctorName`;
      replacements.doctorName = `%${doctorName}%`;
    }
    if (specialization) {
      query += ` AND rd.specialization = :specialization`;
      replacements.specialization = specialization;
    }
    if (branchId) {
      query += ` AND rd.branchId = :branchId`;
      replacements.branchId = branchId;
    }
    if (areaVillage) {
      query += ` AND rd.areaVillage LIKE :areaVillage`;
      replacements.areaVillage = `%${areaVillage}%`;
    }
    if (contactNumber) {
      query += ` AND rd.contactNumber LIKE :contactNumber`;
      replacements.contactNumber = `%${contactNumber}%`;
    }
    if (hospitalName) {
      query += ` AND rd.hospitalName LIKE :hospitalName`;
      replacements.hospitalName = `%${hospitalName}%`;
    }
    if (status === "Active") {
      query += ` AND rd.isActive = 1`;
    } else if (status === "Inactive") {
      query += ` AND rd.isActive = 0`;
    }

    query += ` ORDER BY rd.updatedAt DESC, rd.id DESC`;

    const data = await this.mysqlConnection
      .query(query, {
        replacements,
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting referring doctors", err.message);
        if (err.message && err.message.includes("referring_doctors")) {
          throw new createError.InternalServerError(
            "Referring doctors table is missing. Please run database migration 041_create_referring_doctors.sql"
          );
        }
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  _parseLogAttributes(valueStr) {
    if (!valueStr || valueStr === "-") {
      return {};
    }
    if (valueStr === "Active" || valueStr === "Inactive") {
      return { status: valueStr };
    }

    const labelMap = {
      Name: "doctorDisplayName",
      "Doctor Name": "doctorDisplayName",
      Specialization: "specialization",
      "Branch ID": "branchId",
      "Area/Village": "areaVillage",
      Contact: "contactNumber",
      "Contact Number": "contactNumber",
      Hospital: "hospitalName",
      "Hospital Name": "hospitalName",
      Status: "status"
    };

    const result = {};
    valueStr.split(";").forEach(part => {
      const trimmed = part.trim();
      const idx = trimmed.indexOf(":");
      if (idx === -1) return;
      const label = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      const key = labelMap[label];
      if (key) {
        result[key] = val;
      }
    });

    return result;
  }

  _mapLogRowForDisplay(row, branchMap) {
    const parsed = this._parseLogAttributes(row.updatedValue);
    const branchFromId = parsed.branchId
      ? branchMap[parsed.branchId] ||
        branchMap[Number(parsed.branchId)] ||
        parsed.branchId
      : null;

    return {
      id: row.id,
      doctorDisplayName:
        parsed.doctorDisplayName || row.doctorDisplayName || "-",
      action: row.action,
      specialization: parsed.specialization || row.rdSpecialization || "-",
      branch: branchFromId || row.rdBranch || "-",
      areaVillage: parsed.areaVillage || row.rdAreaVillage || "-",
      contactNumber: parsed.contactNumber || row.rdContactNumber || "-",
      hospitalName: parsed.hospitalName || row.rdHospitalName || "-",
      performedBy: row.performedBy || "-",
      performedAt: row.performedAt
    };
  }

  async _getBranchLookupMap() {
    const branches = await this.mysqlConnection
      .query("SELECT id, branchCode, name FROM branch_master", {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(() => []);

    return branches.reduce((acc, branch) => {
      acc[branch.id] = branch.branchCode || branch.name;
      return acc;
    }, {});
  }

  async getReferringDoctorsLogService() {
    assertReferringDoctorsLogAccess(this._request);

    const [data, branchMap] = await Promise.all([
      this.mysqlConnection
        .query(getReferringDoctorsLogQuery, {
          type: Sequelize.QueryTypes.SELECT
        })
        .catch(err => {
          console.log("Error while getting referring doctors log", err.message);
          if (err.message && err.message.includes("referring_doctors_log")) {
            throw new createError.InternalServerError(
              "Referring doctors log table is missing. Please run database migration 041_create_referring_doctors.sql"
            );
          }
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        }),
      this._getBranchLookupMap()
    ]);

    return data.map(row => this._mapLogRowForDisplay(row, branchMap));
  }

  async downloadOpdSheedByPatientIdService() {
    const { id } = this._request.params;
    let data = await PatientOpdSheetAssociation.findOne({
      where: {
        patientId: id
      }
    }).catch(err => {
      console.log("Error during fetching of opd sheet template", err);
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
    await page.setContent(data.template, {
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
      "Content-Disposition": `attachment; filename=${"opdSheet" +
        "_" +
        id +
        ".pdf"}`,
      "Content-Length": pdf_buffer.length,
      filename: `${"opdSheet"}_${id}.pdf`
    });

    this._response.send(pdf_buffer);
  }
}

module.exports = PatientsService;
