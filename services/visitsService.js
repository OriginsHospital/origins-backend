const { Sequelize } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const lodash = require("lodash");
const {
  isActiveQuery,
  getDonarInformationQuery,
  isPackageExistsQueryForTreatment,
  UpdateActiveQuery,
  donorPaymentCheckQuery
} = require("../queries/visit_queries");
const patientVisitsAssociation = require("../models/Associations/patientVisitsAssociation");
const {
  createVisitSchema,
  editVisitSchema,
  createConsultationOrTreatmentSchema,
  createPackageSchema,
  editPackageSchema,
  applyDiscountForPackageSchema,
  saveDonarSchema,
  editDonarSchema,
  closeVisitSchema,
  closeVisitByConsultationSchema,
  deleteDonorFileSchema,
  saveHysteroscopySchema
} = require("../schemas/visitSchema");
const visitConsultationsAssociations = require("../models/Associations/visitConsultationsAssociations");
const visitTreatmentsAssociations = require("../models/Associations/visitTreatmentsAssociations");
const VisitPackagesAssociation = require("../models/Associations/visitPackagesAssociation");
const treatmentTypes = require("../constants/treatmentTypes");
const VisitDonarsAssociation = require("../models/Associations/visitDonarsAssociation");
const AWSConnection = require("../connections/aws_connection");
const AppointmentsPaymentService = require("./appointmentPaymentsService");
const BloodGroupMaster = require("../models/Master/bloodGroupMaster");
const PatientMasterModel = require("../models/Master/patientMaster");
const VisitHysteroscopyAssociations = require("../models/Associations/visitHysteroscopyAssociations");
const VisitHysteroscopyReferenceImages = require("../models/Associations/visitHysteroscopyReferenceImages");
class VisitsService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.s3 = AWSConnection.getS3();
    this.bucketName = AWSConnection.getS3BucketName();
  }

  async checkIsActiveVisit(patientId) {
    const checkActive = await this.mysqlConnection
      .query(isActiveQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          patientId: patientId
        }
      })
      .catch(err => {
        console.log(
          "Error while updating checking isActive visit Details",
          err.message
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return checkActive[0].activeCount;
  }

  async createVisitService() {
    const createdBy = this._request.userDetails?.id;
    const validatedVisitData = await createVisitSchema.validateAsync(
      this._request.body
    );
    validatedVisitData.createdBy = createdBy;
    const checkIsActiveVisit = await this.checkIsActiveVisit(
      validatedVisitData.patientId
    );
    if (checkIsActiveVisit > 0) {
      throw new createError.BadRequest(Constants.VISIT_ALREADY_EXIST);
    }
    validatedVisitData.isActive = true;
    return await this.mysqlConnection.transaction(async t => {
      const newVisit = await patientVisitsAssociation
        .create(validatedVisitData, {
          transaction: t
        })
        .catch(err => {
          console.log("Error while creating new visit", err.message);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      // Update the patient VisitType With new One
      await PatientMasterModel.update(
        {
          patientTypeId: validatedVisitData?.type // new visitid
        },
        {
          where: {
            id: validatedVisitData?.patientId
          },
          transaction: t
        }
      );
      return newVisit.dataValues;
    });
  }

  async editVisitService() {
    const validatedVisitData = await editVisitSchema.validateAsync(
      this._request.body
    );

    await patientVisitsAssociation
      .update(validatedVisitData, { where: { id: validatedVisitData.id } })
      .catch(err => {
        console.log("Error while creating new visit", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return Constants.VISIT_SUCCESSFULLY_UPDATED;
  }

  async getVisitService() {
    const paramPatientId = Number(this._request.params.patientId);
    const getVisitQuery = `select * from patient_visits_association pva where pva.patientId=:patientId`;
    const visitData = await this.mysqlConnection
      .query(getVisitQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          patientId: paramPatientId
        }
      })
      .catch(err => {
        console.log("Error while getting visits for patient", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return visitData;
  }

  async closeVisitService() {
    const paramVisitId = Number(this._request.params.visitId);
    const validatedVisitData = await closeVisitSchema.validateAsync(
      this._request.body
    );
    if (validatedVisitData?.type.toLowerCase() == "consultation") {
      throw new createError.BadRequest("Cant close visit for Consultation");
    }
    const visitExist = await patientVisitsAssociation
      .findOne({ where: { id: paramVisitId } })
      .catch(err => {
        console.log("Error while getting visit exist check", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    if (!visitExist) {
      throw new createError.BadRequest(Constants.VISIT_DOES_NOT_EXIST);
    }
    if (!visitExist?.isActive) {
      throw new createError.BadRequest(Constants.NO_ACTIVE_VISIT_EXIST);
    }

    await this.mysqlConnection.transaction(async t => {
      /* TODO: Check if Pending payments exists for visitId after payment flow */

      // //check isPackageExists or not
      // const isPackageExistData = await this.mysqlConnection
      //   .query(isPackageExistsQueryForTreatment, {
      //     type: Sequelize.QueryTypes.SELECT,
      //     replacements: {
      //       treatmentCycleId: validatedVisitData?.treatmentCycleId
      //     },
      //     transaction: t
      //   })
      //   .catch(err => {
      //     console.log(
      //       "Error while getting packageExists Data for patient",
      //       err.message
      //     );
      //     throw new createError.InternalServerError(
      //       Constants.SOMETHING_ERROR_OCCURRED
      //     );
      //   });

      // //check pending payments
      // const appointmentPaymentServiceObj = new AppointmentsPaymentService(
      //   this._request,
      //   this._response,
      //   this._next
      // );
      // if (isPackageExistData[0].isPackageExists) {
      //   console.log("red:", isPackageExistData[0].isPackageExists);
      //   const packagePayments = await appointmentPaymentServiceObj.getPendingPaymentAmountForPackageService(
      //     validatedVisitData?.patientId,
      //     new Date().toISOString().split("T")[0]
      //   );
      //   console.log("packagePayments:", packagePayments);
      //   if (packagePayments?.totalPendingAmount > 0) {
      //     throw new createError.BadRequest(
      //       Constants.PENDING_PAYMENTS_FOR_VISIT_CLOSE
      //     );
      //   }
      // } else {
      //   const withoutPackagePayments = await appointmentPaymentServiceObj.getPendingPaymentWithoutPackageService(
      //     validatedVisitData?.type,
      //     validatedVisitData?.appointmentId
      //   );
      //   console.log("withoutPackagePayments:", withoutPackagePayments);
      //   if (withoutPackagePayments?.totalPendingAmount > 0) {
      //     throw new createError.BadRequest(
      //       Constants.PENDING_PAYMENTS_FOR_VISIT_CLOSE
      //     );
      //   }
      // }

      // update closing visit
      const closedBy = this._request.userDetails?.id;
      await this.mysqlConnection
        .query(UpdateActiveQuery, {
          type: Sequelize.QueryTypes.UPDATE,
          replacements: {
            visitId: paramVisitId,
            visitClosedStatus: validatedVisitData?.visitClosedStatus,
            visitClosedReason: validatedVisitData?.visitClosedReason,
            closedBy: closedBy
          },
          transaction: t
        })
        .catch(err => {
          console.log("Error while updating visits isActive", err.message);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    });
    return Constants.VISIT_CLOSED_SUCCESSFULLY;
  }

  async closeVisitByConsultationService() {
    const paramVisitId = Number(this._request.params.visitId);
    const validatedVisitData = await closeVisitByConsultationSchema.validateAsync(
      this._request.body
    );
    if (validatedVisitData?.type.toLowerCase() == "treatment") {
      throw new createError.BadRequest("Cant close visit for Treatment");
    }
    const visitExist = await patientVisitsAssociation
      .findOne({ where: { id: paramVisitId } })
      .catch(err => {
        console.log("Error while getting visit exist check", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    if (!visitExist) {
      throw new createError.BadRequest(Constants.VISIT_DOES_NOT_EXIST);
    }
    if (!visitExist?.isActive) {
      throw new createError.BadRequest(Constants.NO_ACTIVE_VISIT_EXIST);
    }

    await this.mysqlConnection.transaction(async t => {
      // check if treatment exists for visitId
      const existingVisitTreatments = await visitTreatmentsAssociations
        .findAll({
          where: { visitId: paramVisitId }
        })
        .catch(err => {
          console.log("Error while getting visit treatments:", err.message);
          throw new createError.InternalServerError(err.message);
        });

      if (!lodash.isEmpty(existingVisitTreatments)) {
        throw new createError.BadRequest(
          Constants.TREATMENT_EXISTS_CLOSE_IN_TREATMENT
        );
      }

      // update closing visit
      const closedBy = this._request.userDetails?.id;
      await this.mysqlConnection
        .query(UpdateActiveQuery, {
          type: Sequelize.QueryTypes.UPDATE,
          replacements: {
            visitId: paramVisitId,
            visitClosedStatus: validatedVisitData?.visitClosedStatus,
            visitClosedReason: validatedVisitData?.visitClosedReason,
            closedBy: closedBy
          },
          transaction: t
        })
        .catch(err => {
          console.log("Error while updating visits isActive", err.message);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    });
    return Constants.VISIT_CLOSED_SUCCESSFULLY;
  }

  async createConsultationOrTreatmentService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedInfoData = await createConsultationOrTreatmentSchema.validateAsync(
      this._request.body
    );
    const { createType, visitId, packageAmount, type } = validatedInfoData;
    if (createType === "Consultation") {
      const ExistsInitialConsultation = `select vca.id,vca.type from defaultdb.visit_consultations_associations vca 
          INNER JOIN defaultdb.patient_visits_association pva ON vca.visitId = pva.id where pva.id=:visitId`;
      const getData = await this.mysqlConnection
        .query(ExistsInitialConsultation, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            visitId: visitId
          }
        })
        .catch(err => {
          console.log("Error while getting consultation details", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      const hasInitialConsultation = getData.some(
        item => item.type === "Initial Consultation"
      );

      if (type === "Intial Consultation" && hasInitialConsultation) {
        throw new createError.InternalServerError(
          "Initial Consultation Already exists!"
        );
      }
    }
    const dataPassed = {
      visitId: validatedInfoData.visitId,
      type: validatedInfoData.type,
      createdBy: createdByUserId
    };
    if (createType === "Consultation") {
      const consultationRecord = await visitConsultationsAssociations
        .create(dataPassed)
        .catch(err => {
          console.log(
            "Error while creating new visitConsultationsAssociations record",
            err.message
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      return consultationRecord.dataValues;
    } else if (createType === "Treatment") {
      const isTreatmentExistsForVisit = await visitTreatmentsAssociations
        .findOne({
          where: {
            visitId: visitId
          }
        })
        .catch(err => {
          console.log("Error while finding the treatement details", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(isTreatmentExistsForVisit)) {
        throw new createError.BadRequest(
          Constants.TREATMENT_ALREADY_EXISTS_FOR_THIS_VISIT
        );
      }
      const treatmentRecord = await visitTreatmentsAssociations
        .create({
          ...dataPassed,
          treatmentTypeId: validatedInfoData?.treatmentTypeId
        })
        .catch(err => {
          console.log(
            "Error while creating new visitTreatmentsAssociations record",
            err.message
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      // Check if package required or not
      if (
        validatedInfoData?.treatmentTypeId &&
        treatmentTypes[(validatedInfoData?.treatmentTypeId)].isPackageExists
      ) {
        const isPackageExist = await VisitPackagesAssociation.findOne({
          where: {
            visitId: visitId
          }
        });

        if (isPackageExist) {
          throw new createError.Conflict(
            Constants.PACKAGE_ALREADY_EXIST_FOR_VISIT
          );
        }

        await VisitPackagesAssociation.create({
          visitId,
          doctorSuggestedPackage: packageAmount,
          registrationDate: null
        }).catch(err => {
          console.log("Error while creating automatic package", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      }

      return treatmentRecord.dataValues;
    } else {
      throw new createError.BadRequest(
        "Please provide correct createType value"
      );
    }
  }

  async getVisitInfoService() {
    const visitIdParam = this._request.params.visitId;

    const existingVisitConsultations = await visitConsultationsAssociations
      .findAll({
        where: { visitId: visitIdParam }
      })
      .catch(err => {
        console.log("Error while getting visit consultations:", err.message);
        throw new createError.InternalServerError(err.message);
      });

    const existingVisitTreatments = await visitTreatmentsAssociations
      .findAll({
        where: { visitId: visitIdParam }
      })
      .catch(err => {
        console.log("Error while getting visit treatments:", err.message);
        throw new createError.InternalServerError(err.message);
      });

    return {
      Consultations: existingVisitConsultations.map(consultation =>
        consultation.toJSON()
      ),
      Treatments: existingVisitTreatments.map(treatment => treatment.toJSON())
    };
  }

  async createPackageService() {
    const validatedPackageData = await createPackageSchema.validateAsync(
      this._request.body
    );

    const isPackageExist = await VisitPackagesAssociation.findOne({
      where: {
        visitId: validatedPackageData.visitId
      }
    });

    if (isPackageExist) {
      throw new createError.Conflict(Constants.PACKAGE_ALREADY_EXIST_FOR_VISIT);
    }

    const newPackageData = await VisitPackagesAssociation.create(
      validatedPackageData
    ).catch(err => {
      console.log("Error while creating new visit package", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return newPackageData.dataValues;
  }

  async editPackageService() {
    const validatedPackageData = await editPackageSchema.validateAsync(
      this._request.body
    );

    const existingPackage = await VisitPackagesAssociation.findOne({
      where: {
        id: validatedPackageData.id
      }
    });

    if (!existingPackage) {
      throw new createError.NotFound(Constants.PACKAGE_NOT_FOUND);
    }

    const updatedPackageData = await existingPackage
      .update(validatedPackageData)
      .catch(err => {
        console.log("Error while updating visit package", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return Constants.PACKAGE_UPDATED_SUCCESSFULLY;
  }

  async getPackageService() {
    const paramVisitId = Number(this._request.params.visitId);
    const getVisitPackageQuery = `select * from defaultdb.visit_packages_associations vpa where vpa.visitId=:paramVisitId`;
    const visitPackageData = await this.mysqlConnection
      .query(getVisitPackageQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          paramVisitId: paramVisitId
        }
      })
      .catch(err => {
        console.log(
          "Error while getting visitPackages for patient",
          err.message
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return visitPackageData[0];
  }

  async applyDiscountForPackageService() {
    if (![1, 7].includes(this._request.userDetails?.roleDetails?.id)) {
      throw new createError.BadRequest(
        Constants.UNAUTHORIZED_FOR_APPLYING_DISCOUNT
      );
    }

    const {
      packageId,
      discountAmount
    } = await applyDiscountForPackageSchema.validateAsync(this._request.body);
    const existingPackage = await VisitPackagesAssociation.findOne({
      where: { id: packageId }
    });

    if (!existingPackage) {
      throw new createError.NotFound(Constants.PACKAGE_NOT_FOUND);
    }

    if (existingPackage.discount > 0) {
      throw new createError.BadRequest(Constants.DISCOUNT_ALREADY_APPLIED);
    }

    if (discountAmount > existingPackage.marketingPackage) {
      throw new createError.BadRequest(
        Constants.DISCOUNT_AMOUNT_SHOULD_BE_LESS
      );
    }

    let remainingDiscount = discountAmount;
    const fields = [
      "uptPositiveAmount",
      "eraAmount",
      "fetAmount",
      "day5FreezingAmount",
      "hysteroscopyAmount",
      "pickUpAmount",
      "day1Amount"
    ];

    const updatedAmounts = {};

    for (const field of fields) {
      if (remainingDiscount <= 0) break;

      const currentValue = existingPackage[field];
      if (currentValue > 0) {
        if (remainingDiscount >= currentValue) {
          remainingDiscount -= currentValue;
          updatedAmounts[field] = 0;
        } else {
          updatedAmounts[field] = currentValue - remainingDiscount;
          remainingDiscount = 0;
        }
      }
    }

    //if remainingDiscount>0 then given discount amount is more than all amounts so stop operation
    if (remainingDiscount > 0) {
      throw new createError.BadRequest(
        Constants.DISCOUNT_AMOUNT_SHOULD_BE_LESS
      );
    }

    await existingPackage
      .update({
        ...updatedAmounts,
        discount: discountAmount
      })
      .catch(err => {
        console.log("Error while applying discounts to package", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return Constants.DISCOUNT_APPLIED_SUCCESSFULLY;
  }

  async getDonarInformationService() {
    /* donorStatus to show buttons in UI
      0 -> Pay Donor 
      1 -> Create Donor
      2 -> start Donor Trigger
      3 -> View Donor
    */

    const data = await this.mysqlConnection
      .query(getDonarInformationQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("error while getting donar information list", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async getDonarDataByVisitIdService() {
    const paramVisitId = Number(this._request.params.visitId);
    if (!paramVisitId) {
      throw new createError.BadRequest("visit Id is required");
    }
    return await VisitDonarsAssociation.findOne({
      where: {
        visitId: paramVisitId
      }
    }).catch(err => {
      console.log("error while getting donar information by visitId", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async uploadDonarFile(visitId, type, file, transaction) {
    try {
      const key = `visits/${visitId}/${type}`;
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file[0].buffer,
        ContentType: file[0].mimetype
      };

      const uploadResult = await this.s3.upload(uploadParams).promise();
      return uploadResult.Location;
    } catch (error) {
      console.error(`Error uploading ${type} to S3:`, error);
      throw error;
    }
  }

  async saveDonarService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedData = await saveDonarSchema.validateAsync(
      this._request.body
    );
    validatedData.createdBy = createdByUserId;

    //check payment details

    const donorPaymentDetails = await this.mysqlConnection
      .query(donorPaymentCheckQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          visitId: validatedData.visitId
        }
      })
      .catch(err => {
        console.log(
          "Error while getting donorPaymentDetails data",
          err.message
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (donorPaymentDetails[0]?.donorBookingCheck === 0) {
      throw new createError.BadRequest(Constants.DONAR_PAYMENT_NOT_DONE);
    }

    const bloodGroupExists = await BloodGroupMaster.findOne({
      where: { id: validatedData?.bloodGroup, isActive: 1 }
    });

    if (!bloodGroupExists) {
      throw new createError.BadRequest(
        "Invalid or inactive blood group selected"
      );
    }

    const existingDonar = await VisitDonarsAssociation.findOne({
      where: {
        visitId: validatedData.visitId
      }
    });

    if (existingDonar) {
      throw new createError.BadRequest(Constants.SAVE_DONAR_CONFLICT);
    }

    const requiredFiles = [
      "kyc",
      "marriageCertificate",
      "birthCertificate",
      "aadhaar",
      "donarPhotoUrl",
      "donarSignatureUrl",
      "form24b",
      "insuranceCertificate",
      "spouseAadharCard",
      "artBankCertificate",
      "anaesthesiaConsent",
      "form13"
    ];

    const missingFiles = requiredFiles.filter(
      field => !this._request.files?.[field]
    );
    if (missingFiles.length > 0) {
      throw new createError.BadRequest(
        `Missing required files: ${missingFiles.join(", ")}`
      );
    }

    return await this.mysqlConnection.transaction(async t => {
      try {
        //prepare parallel uploads
        const uploadPromises = requiredFiles.map(field =>
          this.uploadDonarFile(
            validatedData.visitId,
            field,
            this._request.files[field],
            t
          ).then(url => ({ field, url }))
        );

        // Execute all uploads in parallel
        const uploadResults = await Promise.all(uploadPromises);

        uploadResults.forEach(({ field, url }) => {
          validatedData[field] = url;
        });

        return await VisitDonarsAssociation.create(validatedData, {
          transaction: t
        });
      } catch (error) {
        console.error("Error in saveDonarService:", error);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      }
    });
  }

  async editDonarService() {
    const updatedByUserId = this._request?.userDetails?.id;
    const validatedData = await editDonarSchema.validateAsync(
      this._request.body
    );

    const existingDonar = await VisitDonarsAssociation.findOne({
      where: { visitId: validatedData.visitId }
    });

    if (!existingDonar) {
      throw new createError.NotFound(Constants.DONAR_NOT_FOUND);
    }

    const fileFields = [
      "kyc",
      "marriageCertificate",
      "birthCertificate",
      "aadhaar",
      "donarPhotoUrl",
      "donarSignatureUrl",
      "form24b",
      "insuranceCertificate",
      "spouseAadharCard",
      "artBankCertificate",
      "anaesthesiaConsent",
      "form13"
    ];

    return await this.mysqlConnection.transaction(async t => {
      try {
        // Prepare parallel uploads only for changed files
        const uploadPromises = fileFields.map(async field => {
          if (this._request.files?.[field]) {
            return this.uploadDonarFile(
              validatedData.visitId,
              field,
              this._request.files[field],
              t
            ).then(url => ({ field, url }));
          }
          //unchanged files - should keep old url as usual
          return { field, url: existingDonar[field] };
        });

        const uploadResults = await Promise.all(uploadPromises);

        uploadResults.forEach(({ field, url }) => {
          validatedData[field] = url;
        });

        validatedData.updatedBy = updatedByUserId;
        await existingDonar.update(validatedData, { transaction: t });

        return existingDonar;
      } catch (error) {
        console.error("Error in editDonarService:", error);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      }
    });
  }

  async deleteDonorFileService() {
    const updatedByUserId = this._request?.userDetails?.id;
    const validatedData = await deleteDonorFileSchema.validateAsync(
      this._request.body
    );

    const { id, visitId, fileType } = validatedData;

    let key = `visits/${visitId}/${fileType}`;

    return await this.mysqlConnection.transaction(async t => {
      try {
        const existingDonar = await VisitDonarsAssociation.findOne({
          where: { visitId },
          transaction: t
        });

        if (!existingDonar) {
          throw new createError.NotFound(Constants.DONAR_NOT_FOUND);
        }

        // Delete the file from S3
        const deleteParams = {
          Bucket: this.bucketName,
          Key: key
        };
        await this.s3.deleteObject(deleteParams).promise();
        console.log("File deleted successfully from S3");

        existingDonar[fileType] = null;

        await existingDonar.update(
          { [fileType]: null, updatedBy: updatedByUserId },
          { transaction: t }
        );

        return existingDonar;
      } catch (error) {
        console.error("Error in delete donor file :", error);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      }
    });
  }

  async saveHysteroscopyService() {
    const validatedData = await saveHysteroscopySchema.validateAsync(
      this._request.body
    );

    return await this.mysqlConnection.transaction(async t => {
      const existingHysteroscopy = await VisitHysteroscopyAssociations.findOne({
        where: {
          visitId: validatedData.visitId,
          patientId: validatedData.patientId
        },
        transaction: t
      });

      if (existingHysteroscopy) {
        await existingHysteroscopy.update(validatedData, { transaction: t });
        return existingHysteroscopy;
      }

      const newHysteroscopy = await VisitHysteroscopyAssociations.create(
        {
          ...validatedData
        },
        { transaction: t }
      ).catch(error => {
        console.error("Error in saveHysteroscopy Service:", error);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
      return newHysteroscopy;
    });
  }

  async getHysteroscopyService() {
    const { patientId, visitId } = this._request.query;
    console.log("patientId, visitId:", patientId, visitId);
    if (!patientId || !visitId) {
      throw new createError.BadRequest(Constants.PATIENTID_VISITID_REQUIRED);
    }

    return await this.mysqlConnection.transaction(async t => {
      const patient = await PatientMasterModel.findOne({
        where: { id: patientId },
        transaction: t
      });

      if (!patient) {
        throw new createError.NotFound(Constants.PATIENT_NOT_FOUND);
      }

      const visit = await patientVisitsAssociation.findOne({
        where: { id: visitId, patientId },
        transaction: t
      });

      if (!visit) {
        throw new createError.NotFound(Constants.VISIT_WITH_PATIENT_NOT_FOUND);
      }
      const hysteroscopy = await VisitHysteroscopyAssociations.findOne({
        where: { patientId, visitId },
        transaction: t
      });

      if (!hysteroscopy) {
        throw new createError.NotFound(Constants.HYSTEROSCOPY_NOT_FOUND);
      }

      const referenceImages = await VisitHysteroscopyReferenceImages.findAll({
        where: { hysteroscopyId: hysteroscopy.id },
        transaction: t
      });

      hysteroscopy.dataValues.referenceImages = referenceImages;

      return hysteroscopy;
    });
  }

  async uploadHysteroscopyReferenceImageToS3(file, hysteroscopyId) {
    try {
      const uniqueFileName = `${file.originalname.split(".")[0]}_${Date.now()}`;
      const extension = file.originalname.split(".").pop();
      const key = `hysteroscopy/referenceImages/${hysteroscopyId}/${uniqueFileName}.${extension}`;

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
      console.log("Error while uploading task image to S3: ", err);
      throw new Error("Error while uploading image");
    }
  }

  async addHysteroscopyReferenceImagesService() {
    const { hysteroscopyId } = this._request.params;

    if (!hysteroscopyId) {
      throw new createError.BadRequest(Constants.PROVIDE_HYSTEROSCOPY_ID);
    }

    const hysteroscopyDetails = await VisitHysteroscopyAssociations.findByPk(
      hysteroscopyId
    );

    if (!hysteroscopyDetails) {
      throw new createError.NotFound(Constants.HYSTEROSCOPY_NOT_FOUND);
    }

    const uploadedBy = this._request.userDetails?.id;

    if (
      !this._request?.files ||
      !this._request?.files?.hysteroscopyReferenceImages
    ) {
      throw new createError.BadRequest(Constants.PROVIDE_REFERENCE_IMAGES);
    }

    return await this.mysqlConnection.transaction(async t => {
      const uploadedImages = [];

      if (
        this._request?.files &&
        this._request?.files?.hysteroscopyReferenceImages
      ) {
        for (const file of this._request.files.hysteroscopyReferenceImages) {
          const {
            imageUrl,
            imageKey
          } = await this.uploadHysteroscopyReferenceImageToS3(
            file,
            hysteroscopyId
          );
          await VisitHysteroscopyReferenceImages.create(
            {
              hysteroscopyId,
              imageUrl,
              imageKey,
              uploadedBy
            },
            { transaction: t }
          ).catch(err => {
            console.log(
              "Error while uploading hysteroscopy reference image",
              err.message
            );
            throw new createError.InternalServerError(
              Constants.SOMETHING_ERROR_OCCURRED
            );
          });

          uploadedImages.push({ imageUrl, imageKey });
        }
      }

      return uploadedImages;
    });
  }

  async deleteHysteroscopyReferenceImageService() {
    const { imageId } = this._request.params;
    if (!imageId) {
      throw new createError.BadRequest("Reference Image ID is required");
    }
    const imageRecord = await VisitHysteroscopyReferenceImages.findByPk(
      imageId
    );
    if (!imageRecord) {
      throw new createError.NotFound("Reference Image not found");
    }

    try {
      await this.s3
        .deleteObject({ Bucket: this.bucketName, Key: imageRecord.imageKey })
        .promise();
    } catch (err) {
      console.log("Error while deleting image from S3: ", err.message);
    }

    await VisitHysteroscopyReferenceImages.destroy({ where: { id: imageId } });

    return "Reference image deleted successfully";
  }
}

module.exports = VisitsService;
