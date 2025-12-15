const { Sequelize } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const { isActiveQuery } = require("../queries/visit_queries");
require("../schemas/visitSchema");
const {
  shiftChangeRequestSchema,
  setIsCompletedTrueSchema
} = require("../schemas/doctorSchema");
const {
  createDoctorAvailabilitySchema,
  saveLabTestsPharmacyNotesSchema
} = require("../schemas/doctorSchema");
const ConsultancyDoctorMasterModel = require("../models/Master/consultancyDoctorMaster");
const PatientMasterModel = require("../models/Master/patientMaster");
const { TimeSlotsService } = require("./timeSlotsService");
const consultationAppointmentNotesAssociations = require("../models/Associations/consultationAppointmentNotesAssociations");
const treatmentAppointmentNotesAssociations = require("../models/Associations/treatmentAppointmentNotesAssociations");
const {
  getDoctorsAvailabiltyListQuery,
  getAppointsmentsByDateQuery,
  getConsulationHistoryByPatientId,
  getAppointmentHistoryByConsultationId,
  patientBasicDetailsQuery,
  getTreatmentCycleHistoryByPatientId,
  getAppointmentHistoryByTreatmentCycleId,
  getConsultationLineBillsAndNotesQuery,
  getTreatmentLineBillsAndNotesQuery,
  getCheckListSheetByPatientIdQuery,
  patientEmbryologyHistoryQuery,
  getAppointsmentsByPatientQuery
} = require("../queries/doctor_queries");
const lodash = require("lodash");
const consultationAppointmentLineBillsAssociations = require("../models/Associations/consultationAppointmentLineBillsAssociations");
const treatmentAppointmentLineBillsAssociations = require("../models/Associations/treatmentAppointmentLineBillsAssociations");
const ShiftChangeRequestMasterModel = require("../models/Master/shiftChangeRequestMaster");
const moment = require("moment-timezone");
const e = require("express");
const ConsultationAppointmentAssociations = require("../models/Associations/consultationAppointmentsAssociations");
const TreatmentAppointmentAssociations = require("../models/Associations/treatmentAppointmentAssociations");
class DoctorsService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
  }

  async createDoctorAvailabiltyService() {
    const { shiftList } = this._request.body;

    try {
      return await this.mysqlConnection.transaction(async t => {
        const updatedDoctorAvailabilities = await Promise.all(
          shiftList.map(async shift => {
            let payload = await createDoctorAvailabilitySchema.validateAsync(
              shift
            );
            const { doctorId, doctorName, ...props } = payload;
            const validatedData = {
              userId: doctorId,
              name: doctorName,
              ...props
            };

            const existingRecord = await ConsultancyDoctorMasterModel.findOne({
              where: { userId: validatedData.userId },
              transaction: t
            });

            if (existingRecord) {
              await ConsultancyDoctorMasterModel.update(validatedData, {
                where: { userId: validatedData.userId },
                transaction: t
              });
            } else {
              await ConsultancyDoctorMasterModel.create(validatedData, {
                transaction: t
              });
            }

            return payload;
          })
        );

        return updatedDoctorAvailabilities;
      });
    } catch (error) {
      console.log("Error while saving doctor availabilities", error.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async getAvailabilityDoctorService() {
    const currentUserBranchId = this._request.userDetails.branchDetails.map(
      branch => {
        return branch.id;
      }
    );

    const data = await this.mysqlConnection
      .query(getDoctorsAvailabiltyListQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          branchId: currentUserBranchId.map(branch => String(branch))
        }
      })
      .catch(err => {
        console.log("Error while getting doctorsList", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async createLineBillsAndNotesForAppointmentService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedLabTests = await saveLabTestsPharmacyNotesSchema.validateAsync(
      this._request.body
    );
    const {
      createType,
      appointmentId,
      lineBillEntries,
      notes,
      isSpouse
    } = validatedLabTests;
    const NotesModel =
      createType === "Consultation"
        ? consultationAppointmentNotesAssociations
        : treatmentAppointmentNotesAssociations;
    const LineBillsModel =
      createType === "Consultation"
        ? consultationAppointmentLineBillsAssociations
        : treatmentAppointmentLineBillsAssociations;
    try {
      return await this.mysqlConnection.transaction(async t => {
        let notesData = null;
        let spouseNotesData = null;

        // Fetch existing records
        const existingLineBills = await LineBillsModel.findAll({
          where: { appointmentId },
          transaction: t
        });

        // Create a map of existing records for comparison
        const existingMap = new Map(
          existingLineBills.map(record => [
            `${record.billTypeId}-${record.billTypeValue}-${record.isSpouse}`,
            record
          ])
        );

        const incomingMap = new Map(); // To track incoming records for deletion check
        const updatePromises = [];
        const insertEntries = [];

        // Process incoming payload
        lineBillEntries.forEach(entry => {
          entry.billTypeValues.forEach(value => {
            const key = `${entry.billTypeId}-${value.id}-${isSpouse}`;
            const prescribedQuantity =
              entry.billTypeId === 3 ? value.prescribedQuantity : 1;
            const prescriptionDays =
              entry.billTypeId === 3 ? value.prescriptionDays : 0;

            incomingMap.set(key, true); // Mark this record as incoming

            if (existingMap.has(key)) {
              const existingRecord = existingMap.get(key);

              // Check if any field needs an update
              if (
                existingRecord.prescribedQuantity !== prescribedQuantity ||
                existingRecord.prescriptionDetails !==
                  value.prescriptionDetails ||
                existingRecord.prescriptionDays !== prescriptionDays
              ) {
                // Update record
                updatePromises.push(
                  LineBillsModel.update(
                    {
                      prescribedQuantity,
                      prescriptionDetails: value.prescriptionDetails,
                      prescriptionDays,
                      createdBy: createdByUserId
                    },
                    {
                      where: { id: existingRecord.id },
                      transaction: t
                    }
                  )
                );
              }

              // Remove from existingMap as it's being handled
              existingMap.delete(key);
            } else {
              // New record
              insertEntries.push({
                appointmentId,
                billTypeId: entry.billTypeId,
                billTypeValue: value.id,
                prescribedQuantity,
                prescriptionDetails: value.prescriptionDetails,
                prescriptionDays,
                isSpouse: isSpouse,
                createdBy: createdByUserId
              });
            }
          });
        });

        // Records left which has status DUE in existingMap need to be deleted
        //we will not delete the record which has status PAID and spouse that not matches
        const deletePromises = Array.from(existingMap.values())
          .filter(
            record => record.status === "DUE" && record.isSpouse === isSpouse
          )
          .map(record => {
            LineBillsModel.destroy({
              where: { id: record.id },
              transaction: t
            });
          });

        // Insert new records
        const createdEntries = await LineBillsModel.bulkCreate(insertEntries, {
          transaction: t
        });

        // Perform updates and deletions
        await Promise.all([...updatePromises, ...deletePromises]);

        // Handle notes
        if (notes && notes.trim() !== "") {
          const [notesRecord, created] = await NotesModel.findOrCreate({
            where: { appointmentId, isSpouse: isSpouse || 0 }, // Add isSpouseForNotes
            defaults: { notes, createdBy: createdByUserId },
            transaction: t
          });

          if (!created) {
            await NotesModel.update(
              { notes },
              {
                where: { appointmentId, isSpouse: isSpouse || 0 },
                transaction: t
              }
            );
            notesData = await NotesModel.findOne({
              where: { appointmentId, isSpouse: isSpouse || 0 },
              transaction: t
            });
          } else {
            notesData = notesRecord;
          }
        } else {
          // If notes is an empty string or not provided, delete the existing notes
          await NotesModel.destroy({
            where: { appointmentId, isSpouse: isSpouse || 0 }, // Include isSpouseForNotes
            transaction: t
          });
          notesData = null; // Set notesData to null as the record is deleted
        }

        //fetch latest data after all operations

        const lineBillsData = await LineBillsModel.findAll({
          where: { appointmentId },
          transaction: t
        });

        notesData = await NotesModel.findOne({
          where: { appointmentId, isSpouse: 0 },
          transaction: t
        });

        //for spouse (male)
        spouseNotesData = await NotesModel.findOne({
          where: { appointmentId, isSpouse: 1 },
          transaction: t
        });

        return {
          lineBillsData: lineBillsData || [],
          notesData: notesData || "",
          spouseNotesData: spouseNotesData || ""
        };
      });
    } catch (error) {
      console.error(
        "Error while saving lab tests, pharmacy, and notes:",
        error.message
      );
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async getLineBillsAndNotesForAppointmentService() {
    const { createType, appointmentId } = this._request.query;
    const getLineBillsQuery =
      createType === "Consultation"
        ? getConsultationLineBillsAndNotesQuery
        : getTreatmentLineBillsAndNotesQuery;

    const NotesModel =
      createType === "Consultation"
        ? consultationAppointmentNotesAssociations
        : treatmentAppointmentNotesAssociations;
    try {
      const lineBillsData = await this.mysqlConnection.query(
        getLineBillsQuery,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            appointmentId: appointmentId
          }
        }
      );

      const notesData = await NotesModel.findOne({
        where: { appointmentId, isSpouse: 0 }
      });
      const spouseNotesData = await NotesModel.findOne({
        where: { appointmentId, isSpouse: 1 }
      });
      return {
        notesData: notesData ? notesData : {},
        spouseNotesData: spouseNotesData ? spouseNotesData : {},
        lineBillsData: lineBillsData ? lineBillsData : []
      };
    } catch (error) {
      console.error(
        "Error while fetching lab, pharmacy, and notes:",
        error.message
      );
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async getAppointmentsByDateService() {
    const { date } = this._request.params;
    if (lodash.isEmpty(date.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "date")
      );
    }
    const doctorId = this._request?.userDetails?.id;
    const data = await this.mysqlConnection
      .query(getAppointsmentsByDateQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          doctorId: doctorId,
          date: date
        }
      })
      .catch(err => {
        console.log("Error while getting doctor appointments", err);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return data;
  }

  async getAppointmentsByPatientService() {
    const { patientId } = this._request.params;
    if (lodash.isEmpty(patientId.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "patientId")
      );
    }
    const getAppointmentsData = await this.mysqlConnection
      .query(getAppointsmentsByPatientQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          patientId: patientId
        }
      })
      .catch(err => {
        console.log("Error while getting doctor appointments", err);
        throw createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return getAppointmentsData;
  }

  async getPatientHistoryService() {
    const { patientId } = this._request.params;
    if (lodash.isEmpty(patientId.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "patientId")
      );
    }
    const response = {};
    const patientDetails = await this.mysqlConnection
      .query(patientBasicDetailsQuery, {
        replacements: {
          patientId: patientId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching patient details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    const patientConsultations = await this.mysqlConnection
      .query(getConsulationHistoryByPatientId, {
        replacements: {
          patientId: patientId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching consultations of patients", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    const patientTreatments = await this.mysqlConnection
      .query(getTreatmentCycleHistoryByPatientId, {
        replacements: {
          patientId: patientId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching consultations of patients", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    response["patientInfo"] = lodash.isEmpty(patientDetails)
      ? {}
      : patientDetails[0];
    response["consultations"] = patientConsultations;
    response["treatments"] = patientTreatments;

    return response;
  }

  async getAppointmentHistoryService() {
    const { type, id } = this._request.query;
    if (lodash.isEmpty(type.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "type")
      );
    }
    if (lodash.isEmpty(id.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "id")
      );
    }

    const historyQuery =
      type == "Consultation"
        ? getAppointmentHistoryByConsultationId
        : getAppointmentHistoryByTreatmentCycleId;

    if (type == "Consultation") {
      return await this.mysqlConnection
        .query(historyQuery, {
          replacements: {
            consultationId: id
          },
          type: Sequelize.QueryTypes.SELECT
        })
        .catch(err => {
          console.log("Error while fetching appointment history", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    } else if (type == "Treatment") {
      return await this.mysqlConnection
        .query(historyQuery, {
          replacements: {
            treatmentCycleId: id
          },
          type: Sequelize.QueryTypes.SELECT
        })
        .catch(err => {
          console.log("Error while fetching appointment history", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    }
    return [];
  }

  async getShiftRequestHistoryService() {
    const userId = this._request?.userDetails?.id;

    const data = await ShiftChangeRequestMasterModel.findOne({
      where: {
        doctorId: userId
      },
      attributes: [
        "shiftFrom",
        "shiftTo",
        "requestStatus",
        "requestedDate",
        "requestAcceptedDate"
      ]
    }).catch(err => {
      console.log("Error while fetching he shift details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return !lodash.isEmpty(data) ? data : [];
  }

  async shiftChangeRequestService() {
    const userId = this._request?.userDetails?.id;
    const shiftRequestSchema = await shiftChangeRequestSchema.validateAsync(
      this._request.body
    );

    const insertdata = {
      ...shiftRequestSchema,
      requestStatus: "PENDING",
      requestedDate: moment()
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss.SSS"),
      doctorId: userId
    };

    const data = await ShiftChangeRequestMasterModel.findOne({
      where: {
        doctorId: userId,
        requestStatus: "PENDING"
      }
    }).catch(err => {
      console.log("Error while fetching he shift details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.SHIFT_REQUEST_EXISTS);
    }

    await ShiftChangeRequestMasterModel.create(insertdata).catch(err => {
      console.log("Error while adding the shift request details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return Constants.SUCCESS;
  }

  async getCheckListSheetByPatientIdService() {
    const { patientId } = this._request.params;
    if (!patientId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR("{{params}}", "patientId")
      );
    }
    return await this.mysqlConnection
      .query(getCheckListSheetByPatientIdQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          patientId: patientId
        }
      })
      .catch(err => {
        console.log("Error while getting checklist data of patient", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async getPatientEmbryologyHistory() {
    const { patientId } = this._request.params;
    if (!patientId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", patientId)
      );
    }
    const patientHistoryData = await this.mysqlConnection
      .query(patientEmbryologyHistoryQuery, {
        replacements: {
          patientId: patientId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error in patient history embryology", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return patientHistoryData.map(data => data.patientInformation[0]);
  }

  async setIsCompletedForAppointmentService() {
    const {
      appointmentId,
      type
    } = await setIsCompletedTrueSchema.validateAsync(this._request.body);

    let model;
    if (type === "Consultation") {
      model = ConsultationAppointmentAssociations;
    } else if (type === "Treatment") {
      model = TreatmentAppointmentAssociations;
    } else {
      throw new createError.BadRequest("Invalid type provided");
    }

    const appointmentData = await model.findOne({
      where: { id: appointmentId },
      attributes: ["isReviewAppointmentCreated"]
    });

    if (!appointmentData || !appointmentData?.isReviewAppointmentCreated) {
      throw new createError.BadRequest(
        "Please create a review appointment first before marking it as seen"
      );
    }

    return await this.mysqlConnection.transaction(async t => {
      const appointment = await model.findOne({
        where: { id: appointmentId },
        transaction: t
      });

      if (!appointment) {
        throw new createError.NotFound("Appointment not found");
      }

      const currentStage = appointment.stage;
      const expectedStage = "Seen";

      // update isCompleted to 1 and stage to "Seen"
      await model.update(
        { isCompleted: 1, stage: expectedStage },
        { where: { id: appointmentId }, transaction: t }
      );
    });
  }
}

module.exports = DoctorsService;
