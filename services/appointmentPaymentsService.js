const { Sequelize, QueryTypes } = require("sequelize");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const timeSlotGenerator = require("time-slots-generator");
const lodash = require("lodash");
const ConsultationAppointmentAssociationModel = require("../models/Associations/consultationAppointmentsAssociations");
const stageConstants = require("../constants/stageConstants");
const moment = require("moment-timezone");
const TreatmentAppointmentAssociationModel = require("../models/Associations/treatmentAppointmentAssociations");
const TreatmentSheetsAssociationModel = require("../models/Associations/treatmentSheetsAssociations");
const consultationAppointmentLineBillsAssociations = require("../models/Associations/consultationAppointmentLineBillsAssociations");
const treatmentAppointmentLineBillsAssociations = require("../models/Associations/treatmentAppointmentLineBillsAssociations");

const {
  consultationGetAvailableDoctorsSchema,
  consultationGetAvailableSlotsSchema,
  consultationBookAppointmentSchema,
  changeStatusSchema,
  getAppointmentsByIdSchema,
  treatmentSheetUpdateSchema,
  treatmentBookAppointmentSchema,
  consultationBookReviewAppointmentSchema,
  updateTreatmentStatusSchema,
  treatmentBookReviewAppointmentSchema,
  deleteAppointmentSchema,
  noShowSchema,
  hysteroscopyUpdateSheetSchema,
  printPrescriptionSchema,
  applyOptOutScema,
  rescheduleAppointmentSchema,
  createOtherAppointmentSchema
} = require("../schemas/appointmentPaymentsSchema");
const {
  consultationGetAvailableDoctorsQuery,
  consultationAvailableSlotsQuery,
  isBookedSlotQuery,
  getAppointmentsByDateQuery,
  getAppointmentByConsultationId,
  getAppointmentByTreatmentId,
  consultationFeeCheckQuery,
  getLastConsultationFeePaymentDetails,
  getTreatmentStatusQuery,
  checkFinalConsultationExistsQuery,
  icsiConsentsExistsQuery,
  icsiNotStartedCheckQuery,
  icsiStartedCheckQuery,
  getPatientFromVisitId,
  getTreatmentCycleInfoFromVisitId,
  checkForPatientPaymentPending,
  appointmentReasonsQuery,
  fetConsentsExistsQuery,
  fetNotStartedCheckQuery,
  appointmentChargesQuery,
  fetStartedCheckQuery,
  oitiNotStartedCheckQuery,
  iuiNotStartedCheckQuery,
  iuiConsentsExistsQuery,
  iuiStartedCheckQuery,
  appointmentReasonsByPatientTypeId,
  getAppointmentInfoByAppointmentId,
  checkPaymentExistsByAppointmentId,
  checkAppointmentExistsOnSameDateQuery,
  checkAntentalPatientVital,
  completedStageCheckQuery,
  printPrescriptionQuery,
  getPendingAppointmentReason,
  checkIsFirstAppointmentInVisit,
  getAllActiveVisitAppointmentsQuery,
  eraNotStartedCheckQuery,
  eraConsentsExistsQuery
} = require("../queries/appointments_payments_queries");
const visitConsultationsAssociations = require("../models/Associations/visitConsultationsAssociations");
const treatmentConstants = require("../constants/treatmentConstants");
const TriggerTimeStampsMaster = require("../models/Master/triggerTimeStampsMaster");
const VisitPackagesAssociation = require("../models/Associations/visitPackagesAssociation");
const OTListMasterModel = require("../models/Master/otListMasterModel");
const TreatmentFetSheetAssociations = require("../models/Associations/treatmentFetSheetsAssociations");
const PatientMasterModel = require("../models/Master/patientMaster");
const hysteroscopySheetTemplate = require("../templates/hysteroscopySheetTemplate");
const {
  isPackageExistsQueryForTreatment,
  isPackageExistsQueryForVisit,
  donorPaymentCheckQuery
} = require("../queries/visit_queries");
const patientVisitsAssociation = require("../models/Associations/patientVisitsAssociation");
const GenerateHtmlTemplate = require("../utils/templateUtils");
const printPrescriptionTemplate = require("../templates/prescriptionDetailsTemplate");
const BaseService = require("../services/baseService");
const DoctorsService = require("./doctorsService");
const AppointmentReasonMaster = require("../models/Master/appointmentReasonMaster");
const AppointmentChargesBranchAssociation = require("../models/Associations/appointmentChargesBranchAssocitation");
const VisitTreatmentsAssociations = require("../models/Associations/visitTreatmentsAssociations");
const TreatmentEraSheetAssociations = require("../models/Associations/treatmentEraSheetsAssociations");
class AppointmentsPaymentService extends BaseService {
  constructor(request, response, next) {
    super(request, response, next);
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.htmlTemplateGenerationObj = new GenerateHtmlTemplate();
  }

  /*
        Returns the doctors List on the specified date who are not on leave
    */
  async consultationGetAvailableDoctorsService() {
    const payload = await consultationGetAvailableDoctorsSchema.validateAsync(
      this._request.body
    );
    const currentUserBranchId = this._request.userDetails.branchDetails.map(
      branch => {
        return branch.id;
      }
    );

    const data = await this.mysqlConnection
      .query(consultationGetAvailableDoctorsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          date: payload.date,
          branchId: currentUserBranchId.map(branch => String(branch))
        }
      })
      .catch(err => {
        console.log("Error while fetching consultation doctor details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async generateTimeSlots(timeArray) {
    // Generate the time slots for 15 minute duration.
    const timeSlots = [];
    timeArray.map(timeDict => {
      const keysInt = Object.keys(timeDict)
        .map(Number)
        .sort((a, b) => a - b);
      for (let i = 0; i < keysInt.length - 1; i++) {
        const currentKey = keysInt[i];
        const nextKey = keysInt[i + 1];
        if (nextKey - currentKey === 15) {
          timeSlots.push(
            `${timeDict[currentKey.toString()]} - ${
              timeDict[nextKey.toString()]
            }`
          );
        }
      }
    });
    return lodash.uniq(timeSlots);
  }

  async consultationGetAvailableSlotsService() {
    const payload = await consultationGetAvailableSlotsSchema.validateAsync(
      this._request.body
    );

    const data = await this.mysqlConnection
      .query(consultationAvailableSlotsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          doctorId: payload.doctorId,
          date: payload.date
        }
      })
      .catch(err => {
        console.log("Error while fetching consultation doctor details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    const blockSlots = [];
    const shiftSlots = [];
    const bookedSlots = [];

    data.map(entry => {
      if (entry.type == "BLOCK") {
        // Generate blocked 15 minutes slots
        const startHour = parseInt(entry.timeStart.split(":")[0]);
        const startMinute = parseInt(entry.timeStart.split(":")[1]);
        const endHour = parseInt(entry.timeEnd.split(":")[0]);
        const endMinute = parseInt(entry.timeEnd.split(":")[1]);
        const blockSlot = [
          [0, startHour * 60 + startMinute],
          [endHour * 60 + endMinute, 1440]
        ];
        blockSlots.push(
          timeSlotGenerator.getTimeSlots(blockSlot, true, "quarter", true, true)
        );
      } else if (entry.type == "BOOKED") {
        // Add 15 minutes appointments slots
        const startHour = parseInt(entry.timeStart.split(":")[0]);
        const startMinute = entry.timeStart.split(":")[1];
        const endHour = parseInt(entry.timeEnd.split(":")[0]);
        const endMinute = entry.timeEnd.split(":")[1];
        bookedSlots.push(
          `${startHour}:${startMinute} - ${endHour}:${endMinute}`
        );
      } else {
        // Generate shift 15 minutes slots
        const startHour = parseInt(entry.timeStart.split(":")[0]);
        const startMinute = parseInt(entry.timeStart.split(":")[1]);
        const endHour = parseInt(entry.timeEnd.split(":")[0]);
        const endMinute = parseInt(entry.timeEnd.split(":")[1]);
        const blockSlot = [
          [0, startHour * 60 + startMinute],
          [endHour * 60 + endMinute, 1440]
        ];
        shiftSlots.push(
          timeSlotGenerator.getTimeSlots(blockSlot, true, "quarter", true, true)
        );
      }
    });

    const totalSlots = await this.generateTimeSlots(shiftSlots);
    const unavailableSlots = await this.generateTimeSlots(blockSlots);

    unavailableSlots.push(...bookedSlots);

    // available slots
    return lodash.difference(totalSlots, unavailableSlots);
  }

  async consultationBookAppointmentService() {
    const payload = await consultationBookAppointmentSchema.validateAsync(
      this._request.body
    );

    const patientAppointmentAlreadyExists = await this.mysqlConnection
      .query(checkAppointmentExistsOnSameDateQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          consultationOrTreatmentCycleId: payload.consultationId,
          timeStart: payload.timeStart,
          timeEnd: payload.timeEnd,
          type: "Consultation",
          appointmentDate: payload.date,
          branchId: payload.branchId || null
        }
      })
      .catch(err => {
        console.log(
          "Error while getting already exists appointment info query",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(patientAppointmentAlreadyExists)) {
      throw new createError.BadRequest(Constants.APPOINTMENT_ALREADY_BOOKED);
    }

    return await this.mysqlConnection.transaction(async t => {
      const inputData = {
        appointmentDate: payload.date,
        consultationDoctorId: payload.doctorId,
        timeStart: payload.timeStart,
        timeEnd: payload.timeEnd,
        consultationId: payload.consultationId,
        appointmentReasonId: payload.appointmentReasonId,
        createdBy: this._request?.userDetails?.id,
        branchId: payload.branchId
      };

      const isBooked = await this.mysqlConnection
        .query(isBookedSlotQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            date: payload.date,
            timeStart: payload.timeStart,
            timeEnd: payload.timeEnd,
            consultationDoctorId: payload.doctorId,
            branchId: payload.branchId || null
          },
          transaction: t
        })
        .catch(err => {
          console.log("Error while getting booked slots details", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(isBooked) && isBooked[0].slotCount > 0) {
        throw new createError.BadRequest(Constants.SLOT_ALREADY_TAKEN);
      }

      await ConsultationAppointmentAssociationModel.create(inputData, {
        transaction: t
      }).catch(err => {
        console.log("Error while adding the appointment details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return Constants.SLOT_BOOKED_SUCCESS;
    });
  }

  async getAppointmentsByDateService() {
    const { date } = this._request.params;
    const { branchId } = this._request.query;
    if (lodash.isEmpty(date.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "date")
      );
    }
    let data = await this.mysqlConnection
      .query(getAppointmentsByDateQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          date: date,
          branchId: branchId || null
        }
      })
      .catch(err => {
        console.log("Error while fetching appointments by date", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      const patientIdsList = data.map(each => each.patientId);

      let lastConsultationFeeDetails = await this.mysqlConnection
        .query(getLastConsultationFeePaymentDetails, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            patientIds: patientIdsList.map(each => String(each))
          }
        })
        .catch(err => {
          console.log(
            "Error while fetching last consultation fee details",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      lastConsultationFeeDetails = lastConsultationFeeDetails.reduce(
        (acc, init) => {
          acc[init.patientId] = {
            ...init,
            paymentSince: moment()
              .tz("Asia/Kolkata")
              .diff(moment(init?.orderDate), "days")
          };
          return acc;
        },
        {}
      );

      data = data.map(eachRow => {
        let consultationFeeDetails =
          lastConsultationFeeDetails[(eachRow?.patientId)];
        eachRow["lastConsultationDetails"] = consultationFeeDetails || null;
        return eachRow;
      });

      /* Get pending Amount Details Based on Treatment Type
        1. If Package Exists : Show Pending Amount of Package
        2. If Package Does Not Exists: Show Appointments Pending Amount
      */
      // Pending Amount details
      await Promise.all(
        data.map(async each => {
          if (each?.isPackageExists == 1) {
            let pendingAmountDetails = await this.getPendingPaymentAmountForPackageService(
              each?.visitId
            );
            each["pendingAmountDetails"] = pendingAmountDetails || null;
          } else {
            let pendingAmountDetails = await this.getPendingPaymentWithoutPackageService(
              each?.visitId
            );
            each["pendingAmountDetails"] = pendingAmountDetails || null;
          }
          each["isPackageExists"] = each?.isPackageExists;
          return each;
        })
      );
    }

    return data;
  }

  async getAppointmentReasonService() {
    const { type, id } = this._request.query;
    if (!type) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{{params}}", "type")
      );
    }
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{{params}}", "id")
      );
    }

    return await this.mysqlConnection
      .query(appointmentReasonsQuery, {
        type: QueryTypes.SELECT,
        replacements: {
          id: id,
          type: type.toLowerCase()
        }
      })
      .catch(err => {
        console.log("Error while fetching appointment reasons", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async getAppointmentReasonByPatientTypeService() {
    const { patientTypeId } = this._request.query;
    if (!patientTypeId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{{params}}", "patientTypeId")
      );
    }
    return await this.mysqlConnection
      .query(appointmentReasonsByPatientTypeId, {
        type: QueryTypes.SELECT,
        replacements: {
          patientTypeId: patientTypeId
        }
      })
      .catch(err => {
        console.log("Error while fetching appointment reasons", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async generateDateRange(startDate, numberOfDates) {
    const dates = [];
    let currentDate = new Date(startDate);
    if (isNaN(currentDate.getTime())) {
      throw new Error("Invalid start date provided");
    }
    for (let i = 0; i < numberOfDates; i++) {
      const day = String(currentDate.getDate()).padStart(2, "0");
      const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      dates.push(`${day}/${month}`);
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    return dates;
  }

  // Function to give default values of Follicular Sheet
  async getTreatmentSheetsService(visitId) {
    const startDate = this._request.params.startDate;

    if (!startDate) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "startDate")
      );
    }
    const dateRange = await this.generateDateRange(startDate, 15);

    // Follicular Rows
    let follicularRows = [
      { value: "<=10", label: "<=10", color: "light" },
      { value: "10.5", label: "10.5", color: "light" },
      { value: "11", label: "11", color: "light" },
      { value: "11.5", label: "11.5", color: "light" },
      { value: "12", label: "12", color: "light" },
      { value: "12.5", label: "12.5", color: "light" },
      { value: "13", label: "13", color: "light" },
      { value: "13.5", label: "13.5", color: "light" },
      { value: "14", label: "14", color: "medium" },
      { value: "14.5", label: "14.5", color: "medium" },
      { value: "15", label: "15", color: "medium" },
      { value: "15.5", label: "15.5", color: "medium" },
      { value: "16", label: "16", color: "medium" },
      { value: "16.5", label: "16.5", color: "medium" },
      { value: "17", label: "17", color: "medium" },
      { value: "17.5", label: "17.5", color: "dark" },
      { value: "18", label: "18", color: "dark" },
      { value: "18.5", label: "18.5", color: "dark" },
      { value: "19", label: "19", color: "dark" },
      { value: "19.5", label: "19.5", color: "dark" },
      { value: ">=20", label: ">=20", color: "dark" },
      { value: "ET", label: "ET", color: "extra-dark" }
    ];

    // Medications
    let medicationsRows = [];

    // Scans
    let scansRows = [
      { value: "E2", label: "E2" },
      { value: "P4", label: "P4" },
      { value: "LH", label: "LH" },
      { value: "UPT", label: "UPT" },
      { value: "B-HCG", label: "B-HCG" }
    ];

    const template = {
      columns: dateRange,
      follicularSheet: {},
      medicationRows: [],
      medicationSheet: {},
      rows: follicularRows,
      scanRows: scansRows,
      scanSheet: {}
    };

    let treamentCycleInfo = await VisitTreatmentsAssociations.findOne({
      where: {
        visitId: visitId
      },
      attributes: ["id"]
    }).catch(err => {
      console.log("Error while fetching treatment cycle id", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(treamentCycleInfo)) {
      // Adding default row into FET sheet table
      await TreatmentSheetsAssociationModel.create({
        template: JSON.stringify(template),
        treatmentCycleId: treamentCycleInfo?.dataValues?.id
      }).catch(err => {
        console.log("Error while creating the treatment sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    return {
      date: dateRange,
      follicularSheet: follicularRows,
      scanSheet: scansRows,
      medicationSheet: medicationsRows
    };
  }

  // Function to give default values of FET Sheet
  async getFetSheetsService(visitId) {
    const startDate = this._request.params.startDate;

    if (!startDate) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "startDate")
      );
    }
    const dateRange = await this.generateDateRange(startDate, 15);

    let follicularRows = [
      { value: "<=10", label: "<=10", color: "light" },
      { value: "10.5", label: "10.5", color: "light" },
      { value: "11", label: "11", color: "light" },
      { value: "11.5", label: "11.5", color: "light" },
      { value: "12", label: "12", color: "light" },
      { value: "12.5", label: "12.5", color: "light" },
      { value: "13", label: "13", color: "light" },
      { value: "13.5", label: "13.5", color: "light" },
      { value: "14", label: "14", color: "medium" },
      { value: "14.5", label: "14.5", color: "medium" },
      { value: "15", label: "15", color: "medium" },
      { value: "15.5", label: "15.5", color: "medium" },
      { value: "16", label: "16", color: "medium" },
      { value: "16.5", label: "16.5", color: "medium" },
      { value: "17", label: "17", color: "medium" },
      { value: "17.5", label: "17.5", color: "dark" },
      { value: "18", label: "18", color: "dark" },
      { value: "18.5", label: "18.5", color: "dark" },
      { value: "19", label: "19", color: "dark" },
      { value: "19.5", label: "19.5", color: "dark" },
      { value: ">=20", label: ">=20", color: "dark" }
    ];

    const medicationsRows = [
      { value: "endofert", label: "TAB ENDOFERT-H 2MG" },
      { value: "estrobet", label: "ESTROBET GEL" },
      { value: "ecospirin", label: "TAB. ECOSPIRIN 150 MG" },
      { value: "asvit", label: "TAB.ASVIT E" },
      { value: "nicardia", label: "TAB.NICARDIA" },
      { value: "bifolate", label: "TAB.BIFOLATE-OD" },
      { value: "pregnasur", label: "TAB.PREGNASUR E-HS" },
      { value: "dolonex", label: "TAB. DOLONEX DT ½ TID" },
      { value: "susten", label: "INJ.SUSTEN 100MG IM" },
      { value: "michelle", label: "CAP.MICHELLE 200MG" },
      { value: "dydropreg", label: "TAB.DYDROPREG" }
    ];

    const scansRows = [];

    const template = {
      columns: dateRange,
      medicationRows: [],
      medicationSheet: [],
      scanRows: scansRows,
      scanSheet: []
    };

    let treamentCycleInfo = await VisitTreatmentsAssociations.findOne({
      where: {
        visitId: visitId
      },
      attributes: ["id"]
    }).catch(err => {
      console.log("Error while fetching treatment cycle id", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(treamentCycleInfo)) {
      // Adding default row into FET sheet table
      await TreatmentFetSheetAssociations.create({
        template: JSON.stringify(template),
        treatmentCycleId: treamentCycleInfo?.dataValues?.id
      }).catch(err => {
        console.log("Error while creating the treatment fet sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    return {
      date: dateRange,
      follicularSheet: follicularRows,
      scanSheet: scansRows,
      medicationSheet: []
    };
  }

  //function to give default values of ERA Sheet
  async getEraSheetsService(visitId) {
    const startDate = this._request.params.startDate;

    if (!startDate) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "startDate")
      );
    }
    const dateRange = await this.generateDateRange(startDate, 15);

    let follicularRows = [
      { value: "<=10", label: "<=10", color: "light" },
      { value: "10.5", label: "10.5", color: "light" },
      { value: "11", label: "11", color: "light" },
      { value: "11.5", label: "11.5", color: "light" },
      { value: "12", label: "12", color: "light" },
      { value: "12.5", label: "12.5", color: "light" },
      { value: "13", label: "13", color: "light" },
      { value: "13.5", label: "13.5", color: "light" },
      { value: "14", label: "14", color: "medium" },
      { value: "14.5", label: "14.5", color: "medium" },
      { value: "15", label: "15", color: "medium" },
      { value: "15.5", label: "15.5", color: "medium" },
      { value: "16", label: "16", color: "medium" },
      { value: "16.5", label: "16.5", color: "medium" },
      { value: "17", label: "17", color: "medium" },
      { value: "17.5", label: "17.5", color: "dark" },
      { value: "18", label: "18", color: "dark" },
      { value: "18.5", label: "18.5", color: "dark" },
      { value: "19", label: "19", color: "dark" },
      { value: "19.5", label: "19.5", color: "dark" },
      { value: ">=20", label: ">=20", color: "dark" }
    ];

    const medicationsRows = [
      { value: "endofert", label: "TAB ENDOFERT-H 2MG" },
      { value: "estrobet", label: "ESTROBET GEL" },
      { value: "ecospirin", label: "TAB. ECOSPIRIN 150 MG" },
      { value: "asvit", label: "TAB.ASVIT E" },
      { value: "nicardia", label: "TAB.NICARDIA" },
      { value: "bifolate", label: "TAB.BIFOLATE-OD" },
      { value: "pregnasur", label: "TAB.PREGNASUR E-HS" },
      { value: "dolonex", label: "TAB. DOLONEX DT ½ TID" },
      { value: "susten", label: "INJ.SUSTEN 100MG IM" },
      { value: "michelle", label: "CAP.MICHELLE 200MG" },
      { value: "dydropreg", label: "TAB.DYDROPREG" }
    ];

    const scansRows = [];

    const template = {
      columns: dateRange,
      medicationRows: [],
      medicationSheet: [],
      scanRows: scansRows,
      scanSheet: []
    };

    let treamentCycleInfo = await VisitTreatmentsAssociations.findOne({
      where: {
        visitId: visitId
      },
      attributes: ["id"]
    }).catch(err => {
      console.log("Error while fetching treatment cycle id", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(treamentCycleInfo)) {
      // Adding default row into FET sheet table
      await TreatmentEraSheetAssociations.create({
        template: JSON.stringify(template),
        treatmentCycleId: treamentCycleInfo?.dataValues?.id
      }).catch(err => {
        console.log("Error while creating the treatment fet sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    return {
      date: dateRange,
      follicularSheet: follicularRows,
      scanSheet: scansRows,
      medicationSheet: []
    };
  }

  async getTreatmentSheetsByIdService() {
    const { id } = this._request.params;
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Treatment Cycle Id")
      );
    }

    return TreatmentSheetsAssociationModel.findOne({
      where: {
        treatmentCycleId: id
      },
      attributes: ["treatmentCycleId", "template"]
    }).catch(err => {
      console.log("Error while getting the treatment Sheet Template", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async getTreatmentStatusService() {
    const { visitId, treatmentType } = this._request.query;
    if (!visitId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "VisitId")
      );
    }

    if (!treatmentType) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "treatmentType")
      );
    }

    const data = await this.mysqlConnection
      .query(getTreatmentStatusQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          visitId: visitId,
          treatmentType: treatmentType
        }
      })
      .catch(err => {
        console.log("Error while getting treatment status", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      return data[0].treatmentStatus;
    }
    throw new createError.BadRequest(Constants.TREATMENT_NOT_FOUND);
  }

  async saveUpdateTreatmentSheetService() {
    const { id, template } = this._request.body;

    const exists = await TreatmentSheetsAssociationModel.findOne({
      where: {
        treatmentCycleId: id
      }
    }).catch(err => {
      console.log("Error while getting the treatment sheet", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(exists)) {
      await TreatmentAppointmentAssociationModel.update(
        {
          template: template
        },
        {
          where: {
            treatmentCycleId: id
          }
        }
      ).catch(err => {
        console.log("Error while updating the treatment sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    } else {
      await TreatmentAppointmentAssociationModel.create({
        treatmentCycleId: id,
        template: template
      }).catch(err => {
        console.log("Error while creating the treatment sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async checkForStagePermission(isPrev, isNext) {
    if (isPrev) {
      // Only Admin and Center manager Can move
      return [1, 7].includes(this._request.userDetails?.roleDetails?.id);
    }
    if (isNext) {
      // Only Admin, Center Manager and Receptionist Can move
      return [1, 6, 7].includes(this._request.userDetails?.roleDetails?.id);
    }
  }

  async checkForVitals(appointmentId, type, patientTypeId, visitId) {
    const data = await this.mysqlConnection
      .query(checkAntentalPatientVital, {
        // name is antenatal but works for all patient types
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          appointmentId: appointmentId,
          type: type
        }
      })
      .catch(err => {
        console.log("Error while checking checkAntentalPatientVital", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    // If Patient is Antenatal Patient, Check Every Appointment
    if (patientTypeId == 2) {
      if (!data.length || data[0]?.antenatalVitalExists == null) {
        return 0;
      }
      return data[0]?.antenatalVitalExists === 1 ? 1 : 0;
    } else {
      // If not antenatal, only for first Appointment
      const isFirstAppointment = await this.mysqlConnection
        .query(checkIsFirstAppointmentInVisit, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            appointmentId: appointmentId,
            type: type,
            visitId: visitId
          }
        })
        .catch(err => {
          console.log("Error while fetching data isFirstAppointment", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (lodash.isEmpty(isFirstAppointment)) {
        return 0;
      }

      if (isFirstAppointment[0]?.isFirstAppointment == 1) {
        // If First Appointment then check for vitals
        return data[0]?.antenatalVitalExists === 1 ? 1 : 0;
      }
      return 1;
    }
  }

  async checkPaymentExistsForAppointment(appointmentId, type) {
    const data = await this.mysqlConnection(checkPaymentExistsByAppointmentId, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: {
        appointmentId: appointmentId,
        type: type
      }
    }).catch(err => {
      console.log("Error while checking payment exists for appointment", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      return null;
    }
    return data;
  }

  async checkForConsultationFee(isPrev, isNext, stage, patientId) {
    if (!isPrev && isNext && stage == "Scan") {
      const data = await this.mysqlConnection
        .query(consultationFeeCheckQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            patientId: patientId
          }
        })
        .catch(err => {
          console.log("Error while checking consultation fee", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(data)) {
        return true;
      }
      return false;
    }
  }

  async getPendingPaymentWithoutPackageService(visitId) {
    const data = await this.mysqlConnection
      .query(appointmentChargesQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          visitId: visitId
        }
      })
      .catch(err => {
        console.log("Error while getting patient payment status", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(data)) {
      return [];
    }
    return lodash.sortBy(data, "mileStoneStartedDate");
  }

  async getPendingPaymentAmountForPackageService(visitId) {
    const COLUMN_PACKAGE_MAPPING =
      treatmentConstants["PACKAGE_AMOUNT_PRODUCT_TYPE_MAPPING"];
    const validDropDownQuery = COLUMN_PACKAGE_MAPPING.map(
      mapping =>
        `SELECT 
        ${mapping.columnName} AS amount, 
        '${mapping.productEnum}' AS productTypeEnum,
        '${mapping.dateColumn}' AS dateColumn,
        '${mapping.displayName}' AS displayName,
        COALESCE(${mapping.dateColumn}, 'NA') as mileStoneStartedDate
       FROM visit_packages_associations
       WHERE ${mapping.columnName} > 0 AND visitId = ${visitId}`
    ).join("\nUNION ALL\n");

    const paymentWithMileStoneQuery = checkForPatientPaymentPending.replaceAll(
      "{unionQuery}",
      validDropDownQuery
    );
    const data = await this.mysqlConnection
      .query(paymentWithMileStoneQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          visitId: visitId
        }
      })
      .catch(err => {
        console.log("Error while getting patient payment status", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(data)) {
      return [];
    }
    return lodash.sortBy(data, "mileStoneStartedDate");
  }

  // Removed Due to Milstone Changes
  async checkInPaymentRestriction(
    isPrev,
    isNext,
    stage,
    patientId,
    appointmentDate,
    isPackageExists,
    appointmentId,
    type
  ) {
    if (!isPrev && isNext && stage == "Doctor") {
      // Payment Restriction For With and Without Package
      let paymentStatus = {};
      if (isPackageExists) {
        paymentStatus = await this.getPendingPaymentAmountForPackageService(
          patientId,
          appointmentDate
        );
      } else {
        paymentStatus = await this.getPendingPaymentWithoutPackageService(
          type,
          appointmentId
        );
      }
      if (
        lodash.isEmpty(paymentStatus) ||
        (!lodash.isEmpty(paymentStatus) &&
          paymentStatus.totalPendingAmount == 0)
      ) {
        return true;
      }
      if (
        !lodash.isEmpty(paymentStatus) &&
        paymentStatus.totalPendingAmount > 0 &&
        paymentStatus?.isPastDueDate == 0
      ) {
        return [1, 7].includes(this._request.userDetails?.roleDetails?.id); // Admin or Center Manager
      }
      if (
        !lodash.isEmpty(paymentStatus) &&
        paymentStatus.totalPendingAmount > 0
      ) {
        return [1].includes(this._request.userDetails?.roleDetails?.id); // Only Admin, if past Date Reached
      }
    }
  }

  async checkForCompletedStage(isNext, isPrev, stage, appointmentId, type) {
    if (!isPrev && isNext && stage == "Done") {
      // If we are moving to next Stage and next stage is DONE then only check this
      const data = await this.mysqlConnection
        .query(completedStageCheckQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            appointmentId: appointmentId,
            type: type
          }
        })
        .catch(err => {
          console.log("Error while checking completed stage cheking", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(data) && data[0]?.moveToCompleteStage == 1) {
        return true;
      }
      return false;
    }

    return true;
  }

  async changeAppointmentStatusService() {
    const payload = await changeStatusSchema.validateAsync(this._request.body);

    let existingInformation = null;
    if (payload.type == "Consultation") {
      existingInformation = await ConsultationAppointmentAssociationModel.findOne(
        {
          where: {
            id: payload.appointmentId
          }
        }
      );
    } else if (payload.type == "Treatment") {
      existingInformation = await TreatmentAppointmentAssociationModel.findOne({
        where: {
          id: payload.appointmentId
        }
      });
    }

    if (lodash.isEmpty(existingInformation)) {
      throw new createError.BadRequest(Constants.APPOINTMENT_NOT_FOUND);
    }

    const currentStage = existingInformation.stage;
    const updateStage = payload.stage;
    let isPrev = false;
    let isNext = false;

    // Check update is to next Stage or Previous Stage
    if (lodash.includes(stageConstants[currentStage].prev, updateStage)) {
      isPrev = true;
    }
    if (lodash.includes(stageConstants[currentStage].next, updateStage)) {
      isNext = true;
    }

    if ((await this.checkForStagePermission(isPrev, isNext)) == false) {
      throw new createError.BadRequest(
        Constants.UNAUTHORIZED_FOR_STAGE_OPERATION
      );
    }

    //check patient type and restrict moving without vitals
    if (currentStage === "Scan" && updateStage === "Doctor") {
      const existingPatient = await PatientMasterModel.findOne({
        where: {
          patientId: payload?.patientId
        }
      });

      if (!existingPatient) {
        throw new createError.BadRequest(Constants.NO_PATIENT_FOUND);
      }

      // For Antenatal Patient Everytime and for other types only for first Appointment
      if (
        (await this.checkForVitals(
          payload?.appointmentId,
          payload?.type,
          existingPatient.dataValues.patientTypeId,
          payload?.visitId
        )) === 0
      ) {
        throw new createError.BadRequest(Constants.UNAUTHORIZED_WITHOUT_VITALS);
      }
    }

    if (
      payload.type == "Consultation" &&
      (await this.checkForConsultationFee(
        isPrev,
        isNext,
        updateStage,
        payload.patientId
      )) == false
    ) {
      throw new createError.BadRequest(Constants.CONSULTATION_FEE_ERROR);
    }

    // From Seen to Completed Cannot move until all related modules are finished
    if (
      (await this.checkForCompletedStage(
        isNext,
        isPrev,
        updateStage,
        payload.appointmentId,
        payload.type
      )) == false
    ) {
      throw new createError.BadRequest(Constants.CANNOT_MOVE_COMPLETED);
    }

    if (isNext) {
      // Check Valid Stage Update or Not
      if (
        !lodash.includes(stageConstants[currentStage].validNext, updateStage)
      ) {
        throw new createError.BadRequest(
          Constants.INVALID_STAGE_OPERATION.replace(
            "{source}",
            currentStage
          ).replace("{destination}", updateStage)
        );
      }
      const updatePayload = {};
      stageConstants[updateStage].numericFields.forEach(field => {
        updatePayload[field] = 1;
      });
      stageConstants[updateStage].dateFields.forEach(field => {
        updatePayload[field] = moment()
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss.SSS");
      });

      if (payload.type == "Consultation") {
        await ConsultationAppointmentAssociationModel.update(
          { ...updatePayload, stage: updateStage },
          {
            where: {
              id: payload.appointmentId
            }
          }
        ).catch(err => {
          console.log("Error while updating the appointment status", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      } else if (payload.type == "Treatment") {
        await TreatmentAppointmentAssociationModel.update(
          { ...updatePayload, stage: updateStage },
          {
            where: {
              id: payload.appointmentId
            }
          }
        ).catch(err => {
          console.log("Error while updating the appointment status", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      }
    } else if (isPrev) {
      const updatePayload = {};

      // Modified all next stages
      stageConstants[updateStage].next.forEach(nextStage => {
        stageConstants[nextStage].numericFields.forEach(field => {
          updatePayload[field] = 0;
        });
        stageConstants[nextStage].dateFields.forEach(field => {
          updatePayload[field] = null;
        });
      });

      // update to new Stage
      stageConstants[updateStage].numericFields.forEach(field => {
        updatePayload[field] = 1;
      });
      stageConstants[updateStage].dateFields.forEach(field => {
        updatePayload[field] = moment()
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss.SSS");
      });

      if (payload.type == "Consultation") {
        await ConsultationAppointmentAssociationModel.update(
          { ...updatePayload, stage: updateStage },
          {
            where: {
              id: payload.appointmentId
            }
          }
        ).catch(err => {
          console.log("Error while updating the appointment status", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      } else if (payload.type == "Treatment") {
        await TreatmentAppointmentAssociationModel.update(
          { ...updatePayload, stage: updateStage },
          {
            where: {
              id: payload.appointmentId
            }
          }
        ).catch(err => {
          console.log("Error while updating the appointment status", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      }
    }
    return [];
  }

  async getAppointmentsByIdService() {
    const { id } = this._request.params;
    const { type } = this._request.query;
    const payload = await getAppointmentsByIdSchema.validateAsync({
      id,
      type
    });

    if (payload.type == "Treatment") {
      const data = await this.mysqlConnection
        .query(getAppointmentByTreatmentId, {
          replacements: {
            id: payload.id
          },
          type: Sequelize.QueryTypes.SELECT
        })
        .catch(err => {
          console.log("Error while fetching data", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      return data;
    } else if (payload.type == "Consultation") {
      const data = await this.mysqlConnection
        .query(getAppointmentByConsultationId, {
          replacements: {
            id: payload.id
          },
          type: Sequelize.QueryTypes.SELECT
        })
        .catch(err => {
          console.log("Error while fetching data", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      return data;
    }
    return [];
  }

  async treatmentGetAvailableDoctorsService() {
    return await this.consultationGetAvailableDoctorsService();
  }

  async treatmentGetAvailableSlotsService() {
    return await this.consultationGetAvailableSlotsService();
  }

  async treatmentBookAppointmentService() {
    const payload = await treatmentBookAppointmentSchema.validateAsync(
      this._request.body
    );

    const patientAppointmentAlreadyExists = await this.mysqlConnection
      .query(checkAppointmentExistsOnSameDateQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          consultationOrTreatmentCycleId: payload.treatmentCycleId,
          timeStart: payload.timeStart,
          timeEnd: payload.timeEnd,
          type: "Treatment",
          appointmentDate: payload.date,
          branchId: payload.branchId || null
        }
      })
      .catch(err => {
        console.log(
          "Error while getting already exists appointment info query",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(patientAppointmentAlreadyExists)) {
      throw new createError.BadRequest(Constants.APPOINTMENT_ALREADY_BOOKED);
    }

    return await this.mysqlConnection.transaction(async t => {
      const inputData = {
        appointmentDate: payload.date,
        consultationDoctorId: payload.doctorId,
        timeStart: payload.timeStart,
        timeEnd: payload.timeEnd,
        treatmentCycleId: payload.treatmentCycleId,
        appointmentReasonId: payload.appointmentReasonId,
        createdBy: this._request?.userDetails?.id,
        branchId: payload.branchId || null
      };

      const isBooked = await this.mysqlConnection
        .query(isBookedSlotQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            date: payload.date,
            timeStart: payload.timeStart,
            timeEnd: payload.timeEnd,
            consultationDoctorId: payload.doctorId,
            branchId: payload.branchId || null
          },
          transaction: t
        })
        .catch(err => {
          console.log("Error while getting booked slots details", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(isBooked) && isBooked[0].slotCount > 0) {
        throw new createError.BadRequest(Constants.SLOT_ALREADY_TAKEN);
      }

      await TreatmentAppointmentAssociationModel.create(inputData, {
        transaction: t
      }).catch(err => {
        console.log("Error while adding the appointment details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return Constants.SLOT_BOOKED_SUCCESS;
    });
  }

  async updateTreatmentStatusValidations(
    validationType,
    visitId,
    treatmentType
  ) {
    // This function will validate all the checks required for updating the status
    if (validationType == "ICSI_CONSENTS_EXISTS") {
      const data = await this.mysqlConnection
        .query(icsiConsentsExistsQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: visitId
          }
        })
        .catch(err => {
          console.log("Error while getting the registration fee status", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (lodash.isEmpty(data) || data[0].statusCheck == 0) {
        throw new createError.BadRequest(
          Constants.ICSI_CONSENTS_DOES_NOT_EXISTS
        );
      }
    } else if (validationType == "ICSI_NOT_STARTED") {
      const data = await this.mysqlConnection
        .query(icsiNotStartedCheckQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: visitId
          }
        })
        .catch(err => {
          console.log("Error while getting the registration fee status", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(data) && data[0].statusCheck == 0) {
        throw new createError.BadRequest(Constants.ICSI_ALREADY_STARETD);
      }
    } else if (validationType == "ICSI_STARTED") {
      const data = await this.mysqlConnection
        .query(icsiStartedCheckQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: visitId
          }
        })
        .catch(err => {
          console.log("Error while getting the registration fee status", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(data) && data[0].statusCheck === 0) {
        throw new createError.BadRequest(Constants.ICSI_NOT_ALREADY_STARETD);
      }
    } else if (validationType == "TRIGGER_NOT_STARTED") {
      const existingTrigger = await TriggerTimeStampsMaster.findOne({
        where: {
          visitId: visitId,
          [Sequelize.Op.or]: [
            { triggerStartDate: { [Sequelize.Op.ne]: null } },
            { triggerStartedBy: { [Sequelize.Op.ne]: null } }
          ]
        }
      });

      if (existingTrigger) {
        throw new createError.BadRequest(
          "Trigger already started. Cannot perform this operation."
        );
      }
    } else if (validationType == "DONOR_PAYMENT_NOT_COMPLETED") {
      const donorPaymentDetails = await this.mysqlConnection
        .query(donorPaymentCheckQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            visitId: visitId
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
    } else if (validationType == "HYSTEROSCOPY_NOT_STARTED") {
      const existingHysteroscopy = await TriggerTimeStampsMaster.findOne({
        where: {
          visitId: visitId,
          [Sequelize.Op.or]: [
            { hysteroscopyTime: { [Sequelize.Op.ne]: null } },
            { hysteroscopyStartedBy: { [Sequelize.Op.ne]: null } }
          ]
        }
      });

      if (existingHysteroscopy) {
        throw new createError.BadRequest(
          "Hysteroscopy already started. Cannot perform this operation."
        );
      }
    } else if (validationType == "FET_CONSENTS_EXISTS") {
      const data = await this.mysqlConnection
        .query(fetConsentsExistsQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: visitId
          }
        })
        .catch(err => {
          console.log(
            "Error while getting the fet consents exists status",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (lodash.isEmpty(data) || data[0].statusCheck == 0) {
        throw new createError.BadRequest(
          Constants.FET_CONSENTS_DOES_NOT_EXISTS
        );
      }
    } else if (validationType == "FET_NOT_STARTED") {
      const data = await this.mysqlConnection
        .query(fetNotStartedCheckQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: visitId
          }
        })
        .catch(err => {
          console.log("Error while getting the fet started check status", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(data) && data[0].statusCheck == 0) {
        throw new createError.BadRequest(Constants.FET_ALREADY_STARTED);
      }
    } else if (validationType == "FET_STARTED") {
      const data = await this.mysqlConnection
        .query(fetStartedCheckQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: visitId
          }
        })
        .catch(err => {
          console.log("Error while getting the fet start status", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(data) && data[0].statusCheck === 0) {
        throw new createError.BadRequest(Constants.FET_NOT_ALREADY_STARETD);
      }
    } else if (validationType == "OITI_NOT_STARTED") {
      const data = await this.mysqlConnection
        .query(oitiNotStartedCheckQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: visitId,
            treatmentType: treatmentType
          }
        })
        .catch(err => {
          console.log("Error while getting the registration fee status", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(data) && data[0].statusCheck == 0) {
        throw new createError.BadRequest(Constants.OITI_ALREADY_STARETD);
      }
    } else if (validationType == "IUI_NOT_STARTED") {
      const data = await this.mysqlConnection
        .query(iuiNotStartedCheckQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: visitId,
            treatmentType: treatmentType
          }
        })
        .catch(err => {
          console.log("Error while getting the registration fee status", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(data) && data[0].statusCheck == 0) {
        throw new createError.BadRequest(Constants.IUI_ALREADY_STARETD);
      }
    } else if (validationType == "IUI_CONSENTS_EXISTS") {
      const data = await this.mysqlConnection
        .query(iuiConsentsExistsQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: visitId
          }
        })
        .catch(err => {
          console.log("Error while getting the IUI Consents", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (lodash.isEmpty(data) || data[0].statusCheck == 0) {
        throw new createError.BadRequest(
          Constants.IUI_CONSENTS_DOES_NOT_EXISTS
        );
      }
    } else if (validationType == "IUI_STARTED") {
      const data = await this.mysqlConnection
        .query(iuiStartedCheckQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: visitId,
            treatmentType: treatmentType
          }
        })
        .catch(err => {
          console.log("Error while getting the registration fee status", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(data) && data[0].statusCheck === 0) {
        throw new createError.BadRequest(Constants.IUI_NOT_ALREADY_STARETD);
      }
    } else if (validationType == "OITI_STARTED") {
      const data = await this.mysqlConnection
        .query(iuiStartedCheckQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: visitId,
            treatmentType: treatmentType
          }
        })
        .catch(err => {
          console.log("Error while getting the registration fee status", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(data) && data[0].statusCheck === 0) {
        throw new createError.BadRequest(Constants.IUI_NOT_ALREADY_STARETD);
      }
    } else if (validationType == "ERA_CONSENTS_EXISTS") {
      const data = await this.mysqlConnection
        .query(eraConsentsExistsQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: visitId
          }
        })
        .catch(err => {
          console.log(
            "Error while getting the era consents exists status",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (lodash.isEmpty(data) || data[0].statusCheck == 0) {
        throw new createError.BadRequest(
          Constants.ERA_CONSENTS_DOES_NOT_EXISTS
        );
      }
    } else if (validationType == "ERA_NOT_STARTED") {
      const data = await this.mysqlConnection
        .query(eraNotStartedCheckQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: visitId
          }
        })
        .catch(err => {
          console.log("Error while getting the era started check status", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(data) && data[0].statusCheck == 0) {
        throw new createError.BadRequest(Constants.ERA_ALREADY_STARTED);
      }
    }
  }

  async updateTreatmentStatusModifications(
    updateType,
    visitId,
    treatmentType,
    transaction,
    triggerTime,
    endedReason,
    fetEndedReason,
    hysteroscopyTime
  ) {
    if (updateType == "START_ICSI") {
      /*
        1. UpdateEntry in the Trigger TimeStamps
        2. Update DAY 1 Date in packages
        3. Generate the Follicular Sheet and Return it. For some treatments we dont need sheet
      */

      await TriggerTimeStampsMaster.create(
        {
          visitId: visitId,
          treatmentType,
          startDate: moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss"),
          startedBy: this._request?.userDetails?.id
        },
        {
          transaction: transaction
        }
      ).catch(err => {
        console.log("Error while adding record in timestamps master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await VisitPackagesAssociation.update(
        {
          day1Date: moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD")
        },
        {
          where: {
            visitId: visitId
          },
          transaction: transaction
        }
      ).catch(err => {
        console.log("Error while updating record in visitpackages master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      this._request.params.startDate = moment()
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD");

      if ([6, 7].includes(treatmentType)) {
        return [];
      }
      return await this.getTreatmentSheetsService(visitId);
    } else if (updateType == "START_IUI") {
      /*
        1. UpdateEntry in the Trigger TimeStamps
        2. No Package FOr IUI - So nothing 
        3. Generate the Follicular Sheet and Return it
      */

      await TriggerTimeStampsMaster.create(
        {
          visitId: visitId,
          treatmentType,
          startDate: moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss"),
          startedBy: this._request?.userDetails?.id
        },
        {
          transaction: transaction
        }
      ).catch(err => {
        console.log("Error while adding record in timestamps master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      this._request.params.startDate = moment()
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD");
      return await this.getTreatmentSheetsService(visitId);
    } else if (updateType == "START_OITI") {
      /*
        1. UpdateEntry in the Trigger TimeStamps
        2. No Package FOr IUI - So nothing 
        3. Generate the Follicular Sheet and Return it
      */

      await TriggerTimeStampsMaster.create(
        {
          visitId: visitId,
          treatmentType,
          startDate: moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss"),
          startedBy: this._request?.userDetails?.id
        },
        {
          transaction: transaction
        }
      ).catch(err => {
        console.log("Error while adding record in timestamps master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      this._request.params.startDate = moment()
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD");
      return await this.getTreatmentSheetsService(visitId);
    } else if (updateType == "START_TRIGGER") {
      /*
        1. UpdateEntry in the Trigger TimeStamps
        2. Calculate 35th hour time based on input and create a OT Record accordingly
        3.//update pickup time in packages table with OT procedure date
      */
      if (isNaN(new Date(triggerTime).getTime())) {
        throw new createError.BadRequest("Invalid triggerTime format.");
      }

      const patientData = await this.mysqlConnection
        .query(
          getPatientFromVisitId,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: {
              visitId: visitId
            }
          },
          { transaction: transaction }
        )
        .catch(err => {
          console.log("Error while getting patient info from visit Id", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      const treatmentCycleInfo = await this.mysqlConnection
        .query(
          getTreatmentCycleInfoFromVisitId,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: {
              visitId: visitId
            }
          },
          { transaction: transaction }
        )
        .catch(err => {
          console.log(
            "Error while getting treatmentcycle info from visit Id",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      // return await this.mysqlConnection.transaction(async t => {
      const createdBy = this._request.userDetails?.id;
      const currentUserBranchId = this._request.userDetails.branchDetails.map(
        branch => branch.id
      );

      const currentTimestamp = new Date(triggerTime);
      // Adjust for timezone issue (subtract 5 hours 30 minutes)
      const adjustedTimestamp = new Date(
        currentTimestamp.getTime() - (5 * 60 + 30) * 60 * 1000
      );
      const hours = 35;

      // Calculate the 35th hour timestamp
      const futureTimestamp = new Date(
        adjustedTimestamp.getTime() + hours * 60 * 60 * 1000
      );
      const procedureDate = futureTimestamp.toISOString().split("T")[0]; // 'YYYY-MM-DD'
      const procedureTime = futureTimestamp.toTimeString().slice(0, 5); // 'HH:mm'
      await TriggerTimeStampsMaster.update(
        {
          triggerStartDate: adjustedTimestamp,
          triggerStartedBy: parseInt(this._request.userDetails?.id, 10)
        },
        {
          where: {
            visitId: visitId,
            treatmentType
          },
          transaction: transaction
        }
      ).catch(err => {
        console.log(
          "Error while updating trigger timestamps in Icsi",
          err.message
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (!patientData.length || !treatmentCycleInfo.length) {
        throw new createError.NotFound(
          "Patient or Treatment Cycle data not found."
        );
      }

      // create the OT Record creation after 35 hours
      const createOTRecord = async () => {
        const createOTParams = {
          branchId: patientData[0]?.branchId || currentUserBranchId[0],
          treatmentCycleId: treatmentCycleInfo[0].id,
          patientName: `${patientData[0]?.firstName} ${patientData[0]?.lastName}`,
          procedureName: "PickUp OT",
          procedureDate: procedureDate,
          time: procedureTime,
          surgeonId: "1",
          anesthetistId: 9,
          otStaff: "7",
          embryologistId: 5
        };

        await OTListMasterModel.create(createOTParams, {
          transaction: transaction
        }).catch(err => {
          console.log("Error while saving the details of OT master", err);
          throw new createError();
        });
      };

      await createOTRecord();
      //update pickup time in packages table with OT procedure date
      await VisitPackagesAssociation.update(
        {
          pickUpDate: procedureDate
        },
        {
          where: {
            visitId: visitId
          },
          transaction: transaction
        }
      ).catch(err => {
        console.log("Error while updating record in visitpackages master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return Constants.TRIGGER_STARTED_SUCCESSFULLY;
    } else if (updateType == "START_DONOR_TRIGGER") {
      /*
        1. UpdateEntry in the Trigger TimeStamps
        2. Calculate 35th hour time based on input and create a OT Record accordingly with Donor name
        3.//update pickup time in packages table with OT procedure date
      */
      if (isNaN(new Date(triggerTime).getTime())) {
        throw new createError.BadRequest("Invalid triggerTime format.");
      }

      //check valid treatmentType or not
      if (treatmentType !== 6 && treatmentType !== 7) {
        throw new createError.BadRequest("Invalid operation to be performed");
      }

      //check donor information is available or not
      const donorData = await this.mysqlConnection
        .query(
          "select vda.donarName from visit_donars_associations vda where vda.visitId = :visitId",
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: {
              visitId: visitId
            }
          }
        )
        .catch(err => {
          console.log("Error while getting donor info from visit Id", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      console.log("Donor Data", donorData);

      if (!donorData.length || !donorData[0]?.donarName) {
        throw new createError.NotFound("Donor data not found.");
      }

      const patientData = await this.mysqlConnection
        .query(
          getPatientFromVisitId,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: {
              visitId: visitId
            }
          },
          { transaction: transaction }
        )
        .catch(err => {
          console.log("Error while getting patient info from visit Id", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      const treatmentCycleInfo = await this.mysqlConnection
        .query(
          getTreatmentCycleInfoFromVisitId,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: {
              visitId: visitId
            }
          },
          { transaction: transaction }
        )
        .catch(err => {
          console.log(
            "Error while getting treatmentcycle info from visit Id",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      // return await this.mysqlConnection.transaction(async t => {
      const createdBy = this._request.userDetails?.id;
      const currentUserBranchId = this._request.userDetails.branchDetails.map(
        branch => branch.id
      );

      const currentTimestamp = new Date(triggerTime);
      const hours = 35;

      // Calculate the 35th hour timestamp
      const futureTimestamp = new Date(
        currentTimestamp.getTime() + hours * 60 * 60 * 1000
      );
      const procedureDate = futureTimestamp.toISOString().split("T")[0]; // 'YYYY-MM-DD'
      const procedureTime = futureTimestamp.toTimeString().slice(0, 5); // 'HH:mm'
      await TriggerTimeStampsMaster.create(
        {
          visitId: visitId,
          treatmentType,
          triggerStartDate: currentTimestamp,
          triggerStartedBy: parseInt(this._request.userDetails?.id, 10)
        },
        {
          where: {
            visitId: visitId,
            treatmentType
          },
          transaction: transaction
        }
      ).catch(err => {
        console.log(
          "Error while updating trigger timestamps in Icsi",
          err.message
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (!patientData.length || !treatmentCycleInfo.length) {
        throw new createError.NotFound(
          "Patient or Treatment Cycle data not found."
        );
      }

      // create the OT Record creation after 35 hours with donor name (patient name)
      const createOTRecord = async () => {
        const createOTParams = {
          branchId: patientData[0]?.branchId || currentUserBranchId[0],
          treatmentCycleId: treatmentCycleInfo[0].id,
          patientName: `${donorData[0]?.donarName} (${patientData[0]?.lastName} ${patientData[0]?.firstName})`,
          procedureName: "PickUp OT",
          procedureDate: procedureDate,
          time: procedureTime,
          surgeonId: "1",
          anesthetistId: 9,
          otStaff: "7",
          embryologistId: 5
        };

        await OTListMasterModel.create(createOTParams, {
          transaction: transaction
        }).catch(err => {
          console.log("Error while saving the details of OT master", err);
          throw new createError();
        });
      };

      await createOTRecord();
      //update pickup time in packages table with OT procedure date
      await VisitPackagesAssociation.update(
        {
          pickUpDate: procedureDate
        },
        {
          where: {
            visitId: visitId
          },
          transaction: transaction
        }
      ).catch(err => {
        console.log("Error while updating record in visitpackages master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return Constants.TRIGGER_STARTED_SUCCESSFULLY;
    } else if (updateType == "START_HYSTEROSCOPY") {
      /*
        1. UpdateEntry in the Trigger TimeStamps
        2. Update Hysteroscopy Date in packages
        3. create OT Record for given time
        3. Return Hyteroscopy Template 
      */
      if (isNaN(new Date(hysteroscopyTime).getTime())) {
        throw new createError.BadRequest("Invalid HysteroscopyTime format.");
      }

      const patientData = await this.mysqlConnection
        .query(
          getPatientFromVisitId,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: {
              visitId: visitId
            }
          },
          { transaction: transaction }
        )
        .catch(err => {
          console.log("Error while getting patient info from visit Id", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      const treatmentCycleInfo = await this.mysqlConnection
        .query(
          getTreatmentCycleInfoFromVisitId,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: {
              visitId: visitId
            }
          },
          { transaction: transaction }
        )
        .catch(err => {
          console.log(
            "Error while getting treatmentcycle info from visit Id",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!patientData.length || !treatmentCycleInfo.length) {
        throw new createError.NotFound(
          "Patient or Treatment Cycle data not found."
        );
      }

      const createdBy = this._request.userDetails?.id;
      const currentUserBranchId = this._request.userDetails.branchDetails.map(
        branch => branch.id
      );

      const currentTimestamp = new Date(hysteroscopyTime);
      const procedureDate = currentTimestamp.toISOString().split("T")[0]; // 'YYYY-MM-DD'
      const procedureTime = currentTimestamp.toTimeString().slice(0, 5); // 'HH:mm'

      await TriggerTimeStampsMaster.update(
        {
          hysteroscopyTime: currentTimestamp,
          hysteroscopyStartedBy: createdBy,
          hysteroscopySheet: hysteroscopySheetTemplate
        },
        {
          where: {
            visitId: visitId,
            treatmentType
          },
          transaction: transaction
        }
      ).catch(err => {
        console.log(
          "Error while updating Hysteroscopy timestamps",
          err.message
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      // create the OT Record creation
      const createOTRecord = async () => {
        const createOTParams = {
          branchId: patientData[0]?.branchId || currentUserBranchId[0],
          treatmentCycleId: treatmentCycleInfo[0].id,
          patientName: `${patientData[0]?.firstName} ${patientData[0]?.lastName}`,
          procedureName: "HYSTEROSCOPY",
          procedureDate: procedureDate,
          time: procedureTime,
          surgeonId: "1",
          anesthetistId: 9,
          otStaff: "7",
          embryologistId: 5
        };

        await OTListMasterModel.create(createOTParams, {
          transaction: transaction
        }).catch(err => {
          console.log("Error while saving the details of OT master", err);
          throw new createError();
        });
      };

      await createOTRecord();

      const isPackageExistData = await this.mysqlConnection
        .query(isPackageExistsQueryForVisit, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            visitId: visitId
          },
          transaction: transaction
        })
        .catch(err => {
          console.log(
            "Error while getting packageExists Data for patient",
            err.message
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      //if package exists , update Hysteroscopy time in packages table with Hysteroscopy Date
      if (isPackageExistData[0].isPackageExists) {
        await VisitPackagesAssociation.update(
          {
            hysteroscopyDate: procedureDate
          },
          {
            where: {
              visitId: visitId
            },
            transaction: transaction
          }
        ).catch(err => {
          console.log(
            "Error while updating record in visitpackages master",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      }

      return hysteroscopySheetTemplate;
    } else if (updateType == "START_FET") {
      /*
        1. UpdateEntry in the Trigger TimeStamps
        2. Update FET Date in packages
        3. Generate the FET and Return it
      */
      if ([1, 2, 3].includes(treatmentType)) {
        throw new createError.BadRequest(Constants.FET_CANNOT_BE_STARTED);
      }
      await TriggerTimeStampsMaster.update(
        {
          visitId: visitId,
          fetStartDate: moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss"),
          fetStartedBy: this._request?.userDetails?.id
        },
        {
          where: {
            visitId: visitId,
            treatmentType
          },
          transaction: transaction
        }
      ).catch(err => {
        console.log("Error while adding record in timestamps master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await VisitPackagesAssociation.update(
        {
          fetDate: moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD")
        },
        {
          where: {
            visitId: visitId
          },
          transaction: transaction
        }
      ).catch(err => {
        console.log("Error while updating record in visitpackages master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      this._request.params.startDate = moment()
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD");
      return await this.getFetSheetsService(visitId);
    } else if (updateType == "START_ERA") {
      /*  //Same as FET but with ERA treatmentType//
        1. UpdateEntry in the Trigger TimeStamps
        2. Update ERA Date in packages
        3. Generate the FET/ERA and Return it
      */
      if ([1, 2, 3].includes(treatmentType)) {
        throw new createError.BadRequest(Constants.ERA_CANNOT_BE_STARTED);
      }
      // Check if a record exists in TriggerTimeStampsMaster for the given visitId
      const existingEraRecord = await TriggerTimeStampsMaster.findOne({
        where: {
          visitId: visitId
        },
        transaction: transaction
      });

      if (existingEraRecord) {
        await TriggerTimeStampsMaster.update(
          {
            visitId: visitId,
            eraStartDate: moment()
              .tz("Asia/Kolkata")
              .format("YYYY-MM-DD HH:mm:ss"),
            eraStartedBy: this._request?.userDetails?.id
          },
          {
            where: {
              visitId: visitId,
              treatmentType
            },
            transaction: transaction
          }
        ).catch(err => {
          console.log("Error while adding record in timestamps master", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      } else {
        await TriggerTimeStampsMaster.create(
          {
            visitId: visitId,
            treatmentType,
            eraStartDate: moment()
              .tz("Asia/Kolkata")
              .format("YYYY-MM-DD HH:mm:ss"),
            eraStartedBy: this._request?.userDetails?.id
          },
          {
            transaction: transaction
          }
        ).catch(err => {
          console.log("Error while creating record in timestamps master", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      }

      await VisitPackagesAssociation.update(
        {
          eraDate: moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD")
        },
        {
          where: {
            visitId: visitId
          },
          transaction: transaction
        }
      ).catch(err => {
        console.log("Error while updating record in visitpackages master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      this._request.params.startDate = moment()
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD");
      return await this.getEraSheetsService(visitId);
    } else if (
      updateType == "END_ICSI" ||
      updateType == "END_IUI" ||
      updateType == "END_OITI"
    ) {
      /*
        1. UpdateEntry in the Trigger TimeStamps
      */
      await TriggerTimeStampsMaster.update(
        {
          visitId: visitId,
          endedReason: endedReason,
          endDate: moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss"),
          endedBy: this._request?.userDetails?.id
        },
        {
          where: {
            visitId: visitId,
            treatmentType: treatmentType
          },
          transaction: transaction
        }
      ).catch(err => {
        console.log("Error while adding record in timestamps master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    } else if (updateType == "END_FET") {
      /*
        1. UpdateEntry in the Trigger TimeStamps
      */
      await TriggerTimeStampsMaster.update(
        {
          visitId: visitId,
          fetEndedReason: fetEndedReason,
          fetEndedDate: moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss"),
          fetEndedBy: this._request?.userDetails?.id
        },
        {
          where: {
            visitId: visitId,
            treatmentType
          },
          transaction: transaction
        }
      ).catch(err => {
        console.log("Error while adding record in timestamps master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    } else if (updateType === "END_ERA") {
      /*
        1. UpdateEntry in the Trigger TimeStamps
      */
      await TriggerTimeStampsMaster.update(
        {
          visitId: visitId,
          eraEndedReason: eraEndedReason,
          eraEndedDate: moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss"),
          eraEndedBy: this._request?.userDetails?.id
        },
        {
          where: {
            visitId: visitId,
            treatmentType
          },
          transaction: transaction
        }
      ).catch(err => {
        console.log("Error while adding record in timestamps master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }
  }

  async updateTreatmentStatusService() {
    const {
      visitId,
      treatmentType,
      stage,
      triggerTime,
      endedReason,
      fetEndedReason,
      hysteroscopyTime
    } = await updateTreatmentStatusSchema.validateAsync(this._request.body);
    const stageExists = treatmentConstants[stage] || "";
    if (!stageExists) {
      throw new createError.BadRequest(Constants.STAGE_DOES_NOT_EXISTS);
    }

    let checkList = [];
    if (Array.isArray(stageExists.checks)) {
      checkList = stageExists.checks;
    } else if (typeof stageExists.checks === "object") {
      checkList = stageExists.checks[treatmentType];
    }

    // Check All the Validations for the STAGE
    await Promise.all(
      checkList.map(async each => {
        await this.updateTreatmentStatusValidations(
          each,
          visitId,
          treatmentType
        );
      })
    );

    return await this.mysqlConnection.transaction(async t => {
      return await this.updateTreatmentStatusModifications(
        stageExists.updates,
        visitId,
        treatmentType,
        t,
        triggerTime,
        endedReason,
        fetEndedReason,
        hysteroscopyTime
      );
    });
  }

  async updateTreatmentSheetService() {
    const { template, id } = await treatmentSheetUpdateSchema.validateAsync(
      this._request.body
    );
    const exists = await TreatmentSheetsAssociationModel.findOne({
      where: {
        treatmentCycleId: id
      }
    }).catch(err => {
      console.log("Error while getting the treatment sheet data", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(exists)) {
      await TreatmentSheetsAssociationModel.update(
        {
          template: template
        },
        {
          where: {
            treatmentCycleId: id
          }
        }
      ).catch(err => {
        console.log("Error while updating the treatment sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    } else {
      await TreatmentSheetsAssociationModel.create({
        template: template,
        treatmentCycleId: id
      }).catch(err => {
        console.log("Error while creating the treatment sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async consultationBookReviewAppointmentService() {
    const createdByUserId = this._request?.userDetails?.id;
    const {
      currentAppointmentId,
      type,
      date,
      doctorId,
      timeStart,
      timeEnd,
      patientId,
      appointmentReasonId,
      branchId
    } = await consultationBookReviewAppointmentSchema.validateAsync(
      this._request.body
    );

    let model;

    if (type === "Consultation") {
      model = ConsultationAppointmentAssociationModel;
    } else if (type === "Treatment") {
      model = TreatmentAppointmentAssociationModel;
    } else {
      throw new createError.BadRequest("Invalid type provided");
    }

    return await this.mysqlConnection.transaction(async t => {
      const getData = await this.mysqlConnection
        .query(checkFinalConsultationExistsQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            patientId: patientId
          },
          transaction: t
        })
        .catch(err => {
          console.log("Error while getting consultation details", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (getData.length < 1) {
        throw new createError.BadRequest(
          "FollowUp Review Consultation cannot be created without initial Consultation"
        );
      }
      let consultationId;
      if (
        getData.length >= 1 &&
        getData[getData.length - 1]?.type === "FollowUp Consultation"
      ) {
        //Followup Consultation Already Exists
        consultationId = getData[getData.length - 1]?.id;
      } else {
        //create new Followup Consultation for patient
        const followupConsultDatatoCreate = {
          visitId: getData[getData.length - 1]?.visitId,
          type: "FollowUp Consultation",
          createdBy: createdByUserId
        };
        const consultationRecord = await visitConsultationsAssociations
          .create(followupConsultDatatoCreate, { transaction: t })
          .catch(err => {
            console.log(
              "Error while creating new visitConsultationsAssociations record",
              err.message
            );
            throw new createError.InternalServerError(
              Constants.SOMETHING_ERROR_OCCURRED
            );
          });
        consultationId = consultationRecord.dataValues.id;
      }

      const payloadData = {
        date,
        doctorId,
        timeStart,
        timeEnd,
        consultationId,
        appointmentReasonId,
        branchId
      };
      const inputData = {
        appointmentDate: payloadData.date,
        consultationDoctorId: payloadData.doctorId,
        timeStart: payloadData.timeStart,
        timeEnd: payloadData.timeEnd,
        consultationId: payloadData.consultationId,
        appointmentReasonId: payloadData.appointmentReasonId,
        branchId: payloadData.branchId,
        createdBy: this._request?.userDetails?.id
      };

      const isBooked = await this.mysqlConnection
        .query(isBookedSlotQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            date: payloadData.date,
            timeStart: payloadData.timeStart,
            timeEnd: payloadData.timeEnd,
            consultationDoctorId: payloadData.doctorId,
            branchId: payloadData.branchId || null
          },
          transaction: t
        })
        .catch(err => {
          console.log("Error while getting booked slots details", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(isBooked) && isBooked[0].slotCount > 0) {
        throw new createError.BadRequest(Constants.SLOT_ALREADY_TAKEN);
      }

      const createdAppointment = await ConsultationAppointmentAssociationModel.create(
        inputData,
        {
          transaction: t
        }
      ).catch(err => {
        console.log("Error while adding the appointment details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      // set createdAppointmentId to isReviewAppointmentCreated
      await model
        .update(
          {
            isReviewAppointmentCreated: createdAppointment.id
          },
          {
            where: {
              id: currentAppointmentId
            },
            transaction: t
          }
        )
        .catch(err => {
          console.log("Error while updating the appointments table", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      return Constants.SLOT_BOOKED_SUCCESS;
    });
  }

  async createLineBills(t, payloadForLineBills) {
    const createdByUserId = this._request?.userDetails?.id;

    const {
      createType,
      appointmentId,
      lineBillEntries,
      isSpouse
    } = payloadForLineBills;
    const LineBillsModel =
      createType === "Consultation"
        ? consultationAppointmentLineBillsAssociations
        : treatmentAppointmentLineBillsAssociations;
    try {
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

      //fetch latest data after all operations
      const lineBillsData = await LineBillsModel.findAll({
        where: { appointmentId },
        transaction: t
      });

      return {
        lineBillsData: lineBillsData || []
      };
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

  async treatmentBookReviewAppointmentService() {
    const createdByUserId = this._request?.userDetails?.id;

    const {
      currentAppointmentId,
      type,
      date,
      doctorId,
      treatmentCycleId,
      appointmentReasonId,
      hasAnyFuturePrescription,
      lineBillEntries,
      branchId
    } = await treatmentBookReviewAppointmentSchema.validateAsync(
      this._request.body
    );

    let model;

    if (type === "Consultation") {
      model = ConsultationAppointmentAssociationModel;
    } else if (type === "Treatment") {
      model = TreatmentAppointmentAssociationModel;
    } else {
      throw new createError.BadRequest("Invalid type provided");
    }

    return await this.mysqlConnection.transaction(async t => {
      //find available slots of doctor by date
      const data = await this.mysqlConnection
        .query(consultationAvailableSlotsQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            doctorId: doctorId,
            date: date
          },
          transaction: t
        })
        .catch(err => {
          console.log("Error while fetching consultation doctor details", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      const blockSlots = [];
      const shiftSlots = [];
      const bookedSlots = [];

      data.map(entry => {
        if (entry.type == "BLOCK") {
          // Generate blocked 15 minutes slots
          const startHour = parseInt(entry.timeStart.split(":")[0]);
          const startMinute = parseInt(entry.timeStart.split(":")[1]);
          const endHour = parseInt(entry.timeEnd.split(":")[0]);
          const endMinute = parseInt(entry.timeEnd.split(":")[1]);
          const blockSlot = [
            [0, startHour * 60 + startMinute],
            [endHour * 60 + endMinute, 1440]
          ];
          blockSlots.push(
            timeSlotGenerator.getTimeSlots(
              blockSlot,
              true,
              "quarter",
              true,
              true
            )
          );
        } else if (entry.type == "BOOKED") {
          // Add 15 minutes appointments slots
          const startHour = parseInt(entry.timeStart.split(":")[0]);
          const startMinute = entry.timeStart.split(":")[1];
          const endHour = parseInt(entry.timeEnd.split(":")[0]);
          const endMinute = entry.timeEnd.split(":")[1];
          bookedSlots.push(
            `${startHour}:${startMinute} - ${endHour}:${endMinute}`
          );
        } else {
          // Generate shift 15 minutes slots
          const startHour = parseInt(entry.timeStart.split(":")[0]);
          const startMinute = parseInt(entry.timeStart.split(":")[1]);
          const endHour = parseInt(entry.timeEnd.split(":")[0]);
          const endMinute = parseInt(entry.timeEnd.split(":")[1]);
          const blockSlot = [
            [0, startHour * 60 + startMinute],
            [endHour * 60 + endMinute, 1440]
          ];
          shiftSlots.push(
            timeSlotGenerator.getTimeSlots(
              blockSlot,
              true,
              "quarter",
              true,
              true
            )
          );
        }
      });

      const totalSlots = await this.generateTimeSlots(shiftSlots);
      const unavailableSlots = await this.generateTimeSlots(blockSlots);

      unavailableSlots.push(...bookedSlots);

      // available slots
      const availableSlots = lodash.difference(totalSlots, unavailableSlots);

      if (availableSlots.length < 1) {
        throw new createError.BadRequest(
          "No available slots for given doctor on this date"
        );
      }
      const firstAvailableSlot = availableSlots[0];
      const [timeStart, timeEnd] = firstAvailableSlot.split(" - ");

      //got all data so creating a treatment
      const payload = {
        date,
        doctorId,
        timeStart,
        timeEnd,
        treatmentCycleId,
        appointmentReasonId: appointmentReasonId,
        branchId: branchId || null
      };

      const inputData = {
        appointmentDate: payload.date,
        consultationDoctorId: payload.doctorId,
        timeStart: payload.timeStart,
        timeEnd: payload.timeEnd,
        treatmentCycleId: payload.treatmentCycleId,
        appointmentReasonId: payload.appointmentReasonId,
        createdBy: createdByUserId,
        branchId: payload.branchId || null
      };

      const isBooked = await this.mysqlConnection
        .query(isBookedSlotQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            date: payload.date,
            timeStart: payload.timeStart,
            timeEnd: payload.timeEnd,
            consultationDoctorId: payload.doctorId,
            branchId: payload.branchId || null
          },
          transaction: t
        })
        .catch(err => {
          console.log("Error while getting booked slots details", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(isBooked) && isBooked[0].slotCount > 0) {
        throw new createError.BadRequest(Constants.SLOT_ALREADY_TAKEN);
      }

      const createdAppointment = await TreatmentAppointmentAssociationModel.create(
        inputData,
        {
          transaction: t
        }
      ).catch(err => {
        console.log("Error while adding the appointment details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      // set createdAppointmentId to isReviewAppointmentCreated
      await model
        .update(
          {
            isReviewAppointmentCreated: createdAppointment.id
          },
          {
            where: {
              id: currentAppointmentId
            },
            transaction: t
          }
        )
        .catch(err => {
          console.log("Error while updating the appointments table", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (hasAnyFuturePrescription) {
        //by default sending isSpouse as 0 and type Treatment
        const payloadForLineBills = {
          createType: "Treatment",
          appointmentId: createdAppointment.id,
          lineBillEntries,
          isSpouse: 0
        };
        await this.createLineBills(t, payloadForLineBills);
      }

      return Constants.SLOT_BOOKED_SUCCESS;
    });
  }

  async getTreatmentFetSheetsByIdService() {
    const { id } = this._request.params;
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Treatment Cycle Id")
      );
    }

    return TreatmentFetSheetAssociations.findOne({
      where: {
        treatmentCycleId: id
      },
      attributes: ["treatmentCycleId", "template"]
    }).catch(err => {
      console.log("Error while getting the treatment Fet Sheet Template", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async updateTreatmentFetSheetHandler() {
    const { template, id } = await treatmentSheetUpdateSchema.validateAsync(
      this._request.body
    );
    const exists = await TreatmentFetSheetAssociations.findOne({
      where: {
        treatmentCycleId: id
      }
    }).catch(err => {
      console.log("Error while getting the treatment fet sheet data", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(exists)) {
      await TreatmentFetSheetAssociations.update(
        {
          template: template
        },
        {
          where: {
            treatmentCycleId: id
          }
        }
      ).catch(err => {
        console.log("Error while updating the treatment fet sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    } else {
      await TreatmentFetSheetAssociations.create({
        template: template,
        treatmentCycleId: id
      }).catch(err => {
        console.log("Error while creating the treatment fet sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getTreatmentEraSheetsByIdService() {
    const { id } = this._request.params;
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Treatment Cycle Id")
      );
    }

    return TreatmentEraSheetAssociations.findOne({
      where: {
        treatmentCycleId: id
      },
      attributes: ["treatmentCycleId", "template"]
    }).catch(err => {
      console.log("Error while getting the treatment Era Sheet Template", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async updateTreatmentEraSheetHandler() {
    const { template, id } = await treatmentSheetUpdateSchema.validateAsync(
      this._request.body
    );
    const exists = await TreatmentEraSheetAssociations.findOne({
      where: {
        treatmentCycleId: id
      }
    }).catch(err => {
      console.log("Error while getting the treatment era sheet data", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(exists)) {
      await TreatmentEraSheetAssociations.update(
        {
          template: template
        },
        {
          where: {
            treatmentCycleId: id
          }
        }
      ).catch(err => {
        console.log("Error while updating the treatment era sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    } else {
      await TreatmentEraSheetAssociations.create({
        template: template,
        treatmentCycleId: id
      }).catch(err => {
        console.log("Error while creating the treatment era sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async deleteAppointmentService() {
    const payload = await deleteAppointmentSchema.validateAsync(
      this._request.body
    );

    if (![1, 7].includes(this._request.userDetails?.roleDetails?.id)) {
      throw new createError.BadRequest(
        Constants.UNAUTHORIZED_FOR_APPOINMENT_DELETION
      );
    }

    const appointmentStageInfo = await this.mysqlConnection
      .query(getAppointmentInfoByAppointmentId, {
        replacements: {
          appointmentId: payload?.appointmentId,
          type: payload?.type
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting appointment Stage Info", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(appointmentStageInfo)) {
      throw new createError.BadRequest(Constants.APPOINTMENT_NOT_FOUND);
    }

    const currentStage = appointmentStageInfo[0]?.currentStage;

    if (!["Booked"].includes(currentStage)) {
      throw new createError.BadRequest(Constants.APPOINTMENT_DELETION_STAGE);
    }

    if (payload?.type == "Consultation") {
      await ConsultationAppointmentAssociationModel.destroy({
        where: {
          id: payload?.appointmentId
        }
      }).catch(err => {
        console.log("Error while deleting appointment", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    } else if (payload?.type == "Treatment") {
      await TreatmentAppointmentAssociationModel.destroy({
        where: {
          id: payload?.appointmentId
        }
      }).catch(err => {
        console.log("Error while deleting appointment", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    return Constants.DELETED_SUCCESSFULLY;
  }

  async applyNoShowService() {
    const noShowValidatedPayload = await noShowSchema.validateAsync(
      this._request.body
    );

    const { appointmentId, type, noShowReason } = noShowValidatedPayload;

    let model;

    if (type === "Consultation") {
      model = ConsultationAppointmentAssociationModel;
    } else if (type === "Treatment") {
      model = TreatmentAppointmentAssociationModel;
    } else {
      throw new createError.BadRequest("Invalid type provided");
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
      const expectedStage = "Done";

      await model
        .update(
          { noShow: 1, noShowReason, stage: expectedStage },
          { where: { id: appointmentId }, transaction: t }
        )
        .catch(err => {
          console.log("Error while updating No Show", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      return Constants.NOSHOWAPPLIED_SUCCESSFULLY;
    });
  }

  async getHysteroscopySheetByVisitIdService() {
    const { visitId } = this._request.params;
    if (!visitId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Visit Id")
      );
    }

    return TriggerTimeStampsMaster.findOne({
      where: {
        visitId: visitId
      },
      attributes: ["visitId", "hysteroscopySheet"]
    }).catch(err => {
      console.log(
        "Error while getting the hysteroscopySheet Sheet Template",
        err
      );
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async updateHysteroscopySheetByVisitIdService() {
    const hysteroscopyUpdateTemplatePayload = await hysteroscopyUpdateSheetSchema.validateAsync(
      this._request.body
    );
    const { visitId, hysteroscopyTemplate } = hysteroscopyUpdateTemplatePayload;
    const visitExist = await patientVisitsAssociation
      .findOne({ where: { id: visitId } })
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

    return await this.mysqlConnection.transaction(async t => {
      //check if visit Exists in TriggerTimeStampsMaster
      const triggerTimeStampsMasterData = await TriggerTimeStampsMaster.findOne(
        {
          where: {
            visitId: visitId
          },
          transaction: t
        }
      ).catch(err => {
        console.log("Error while getting the trigger timestamps data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (!triggerTimeStampsMasterData) {
        throw new createError.BadRequest(Constants.VISIT_DOES_NOT_EXIST);
      }

      await TriggerTimeStampsMaster.update(
        {
          hysteroscopySheet: hysteroscopyTemplate
        },
        {
          where: {
            visitId: visitId
          }
        }
      ).catch(err => {
        console.log("Error while updating the hysteroscopy sheet", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    });
  }

  async printPrescriptionService() {
    const validatedPayload = await printPrescriptionSchema.validateAsync(
      this._request.body
    );

    const NULL_TEMPLATE = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          html, body {
            margin: 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <p>No Data Found!</p>
      </body>
    </html>`;

    const data = await this.mysqlConnection
      .query(printPrescriptionQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          appointmentId: validatedPayload?.appointmentId,
          type: validatedPayload?.type,
          isSpouse: validatedPayload?.isSpouse
        }
      })
      .catch(err => {
        console.log("Error while fetching prescription details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (
      lodash.isEmpty(data) ||
      (lodash.isEmpty(data[0]?.prescriptionDetails) &&
        lodash.isEmpty(data[0]?.notesDetails))
    ) {
      return NULL_TEMPLATE;
    }
    const hospitalLogoHeaderTemplate = await this.hospitalLogoHeaderTemplate(
      validatedPayload?.appointmentId,
      validatedPayload?.type
    );
    // check if labs, scans, embryology and pharmacy exists: to display content conditionally
    const updatedData = data.map(patient => {
      let labsExists = false;
      let scanExists = false;
      let pharmacyExists = false;
      let embryologyExists = false;
      let notesExists = false;

      patient?.prescriptionDetails?.forEach(detail => {
        if (detail?.lineBillId === 1 && detail.lineBillDetails.length > 0) {
          labsExists = true;
        }
        if (detail?.lineBillId === 2 && detail.lineBillDetails.length > 0) {
          scanExists = true;
        }
        if (detail?.lineBillId === 3 && detail.lineBillDetails.length > 0) {
          pharmacyExists = true;
        }
        if (detail?.lineBillId === 4 && detail.lineBillDetails.length > 0) {
          embryologyExists = true;
        }
      });

      if (patient?.notesDetails && patient?.notesDetails?.length > 0) {
        notesExists = true;
      }

      return {
        ...patient,
        labsExists,
        scanExists,
        pharmacyExists,
        embryologyExists,
        notesExists
      };
    });

    // modify data for handlebars
    const transformedData = updatedData.map(entry => {
      const {
        patientDetails,
        prescriptionDetails,
        notesDetails,
        labsExists,
        scanExists,
        pharmacyExists,
        embryologyExists,
        notesExists
      } = entry;

      // Categorizing prescription details into different sections
      let labDetails = [];
      let scanDetails = [];
      let pharmacyDetails = [];
      let embryologyDetails = [];

      prescriptionDetails?.forEach(detail => {
        if (detail?.lineBillId === 1) {
          labDetails = detail.lineBillDetails;
        } else if (detail?.lineBillId === 2) {
          scanDetails = detail.lineBillDetails;
        } else if (detail?.lineBillId === 3) {
          pharmacyDetails = detail.lineBillDetails;
        } else if (detail?.lineBillId === 4) {
          embryologyDetails = detail.lineBillDetails;
        }
      });

      return {
        ...patientDetails,
        hospitalLogoInformation: hospitalLogoHeaderTemplate,
        showLabs: labsExists,
        showScans: scanExists,
        showPharmacy: pharmacyExists,
        showEmbryology: embryologyExists,
        showNotes: notesExists,
        labDetails,
        scanDetails,
        pharmacyDetails,
        embryologyDetails,
        notesDetails
      };
    });
    const htmlContent = await this.htmlTemplateGenerationObj.generateTemplateFromText(
      printPrescriptionTemplate,
      transformedData.length > 0 ? transformedData[0] : []
    );
    return htmlContent;
  }

  async applyOptOutService() {
    const validatedPayload = await applyOptOutScema.validateAsync(
      this._request.body
    );

    if (validatedPayload?.type == "Consultation") {
      await consultationAppointmentLineBillsAssociations
        .update(
          {
            status: validatedPayload?.isOptOut == 1 ? "OPT_OUT" : "DUE"
          },
          {
            where: {
              id: validatedPayload?.id // array of ids
            }
          }
        )
        .catch(err => {
          console.log("Error while marking optout for consultation", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    } else if (validatedPayload?.type == "Treatment") {
      await treatmentAppointmentLineBillsAssociations
        .update(
          {
            status: validatedPayload?.isOptOut == 1 ? "OPT_OUT" : "DUE"
          },
          {
            where: {
              id: validatedPayload?.id // array of ids
            }
          }
        )
        .catch(err => {
          console.log("Error while marking optout for consultation", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    }

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getPendingInformationService() {
    const { appointmentId, type } = this._request.query;
    if (!appointmentId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Appointment Id")
      );
    }
    if (!type) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Type")
      );
    }

    const data = await this.mysqlConnection
      .query(getPendingAppointmentReason, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          type: type,
          appointmentId: appointmentId
        }
      })
      .catch(err => {
        console.log("Error while getting pending information", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return !lodash.isEmpty(data) ? data : [];
  }

  async rescheduleAppointmentService() {
    const reschedulePayload = await rescheduleAppointmentSchema.validateAsync(
      this._request.body
    );
    const {
      timeStart,
      timeEnd,
      id,
      type,
      consultationDoctorId,
      appointmentDate
    } = reschedulePayload;

    const appointmentStageInfo = await this.mysqlConnection
      .query(getAppointmentInfoByAppointmentId, {
        replacements: {
          appointmentId: id,
          type: type
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting appointment Stage Info", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(appointmentStageInfo)) {
      throw new createError.BadRequest(Constants.APPOINTMENT_NOT_FOUND);
    }

    if (!["Booked"].includes(appointmentStageInfo[0]?.currentStage)) {
      throw new createError.BadRequest(Constants.RESCHEDULE_NOT_ALLOWED);
    }

    const checkDoctorAppointmentAlreadyBooked = await this.mysqlConnection
      .query(isBookedSlotQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          timeStart: timeStart,
          timeEnd: timeEnd,
          consultationDoctorId: consultationDoctorId,
          date: appointmentDate,
          branchId: appointmentStageInfo[0]?.branchId || null
        }
      })
      .catch(err => {
        console.log("Error while finding doctor slot taken", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (
      !lodash.isEmpty(checkDoctorAppointmentAlreadyBooked) &&
      checkDoctorAppointmentAlreadyBooked[0].slotCount > 0
    ) {
      throw new createError.BadRequest(Constants.SLOT_ALREADY_TAKEN);
    }

    if (type === "Consultation") {
      await ConsultationAppointmentAssociationModel.update(
        {
          appointmentDate: appointmentDate,
          timeStart: timeStart,
          timeEnd: timeEnd,
          consultationDoctorId: consultationDoctorId
        },
        {
          where: {
            id: id
          }
        }
      ).catch(err => {
        console.log("Error while updating the appointment details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    } else if (type === "Treatment") {
      await TreatmentAppointmentAssociationModel.update(
        {
          appointmentDate: appointmentDate,
          timeStart: timeStart,
          timeEnd: timeEnd,
          consultationDoctorId: consultationDoctorId
        },
        {
          where: {
            id: id
          }
        }
      ).catch(err => {
        console.log("Error while updating the appointment details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    return Constants.APPOINTMENT_RESCHEDULED_SUCCESSFULLY;
  }

  async createOtherAppointmentReasonService() {
    const otherAppointmentReasonPayload = await createOtherAppointmentSchema.validateAsync(
      this._request.body
    );

    const {
      appointmentReasonName,
      patientId,
      isSpouse
    } = otherAppointmentReasonPayload;
    const createdByUserId = this._request?.userDetails?.id;
    return await this.mysqlConnection.transaction(async t => {
      const existingPatient = await PatientMasterModel.findOne({
        where: {
          id: patientId
        },
        transaction: t
      });

      if (!existingPatient) {
        throw new createError.BadRequest(Constants.NO_PATIENT_FOUND);
      }

      const newAppointmentReason = await AppointmentReasonMaster.create(
        {
          name: appointmentReasonName,
          isOther: 1,
          isSpouse: isSpouse,
          visit_type: existingPatient?.dataValues?.patientTypeId,
          createdBy: createdByUserId
        },
        { transaction: t }
      ).catch(err => {
        console.log("Error while getting appointment reason addition", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      const appointmentReasonId = newAppointmentReason?.dataValues?.id;
      const createdNewAppointmentReason = await AppointmentChargesBranchAssociation.create(
        {
          appointmentCharges: 0,
          appointmentReasonId: appointmentReasonId,
          branchId: existingPatient?.dataValues?.branchId,
          createdBy: createdByUserId
        },
        { transaction: t }
      ).catch(err => {
        console.log(
          "Error while getting appointment charges reason addition",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return {
        ...createdNewAppointmentReason.dataValues,
        appointmentReasonName
      };
    });
  }

  async getAllActiveVisitAppointmentsService() {
    const { activeVisitId } = this._request.params;
    if (!activeVisitId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Active Visit Id")
      );
    }
    const data = await this.mysqlConnection
      .query(getAllActiveVisitAppointmentsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          activeVisitId: activeVisitId
        }
      })
      .catch(err => {
        console.log("Error while getting all active visit appointments", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data || [];
  }
}

module.exports = AppointmentsPaymentService;
