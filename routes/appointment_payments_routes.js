const express = require("express");
const { asyncHandler } = require("../middlewares/errorHandlers");
const AppointmentsPaymentController = require("../controllers/appointmentsPaymentsController.js");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const queue = require("express-queue");

class AppointmentPaymentRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    // GET
    this._route.get(
      "/appointments/getAppointmentsByDate/:date",
      checkActiveSession,
      tokenVerified,
      this.getAppointmentsByDate
    );
    this._route.get(
      "/appointments/getAppointmentsById/:id",
      checkActiveSession,
      tokenVerified,
      this.getAppointmentsByIdHandler
    );
    this._route.get(
      "/appointments/getAppointmentReasons",
      checkActiveSession,
      tokenVerified,
      this.getAppointmentReasonsHandler
    );
    this._route.get(
      "/appointments/getAppointmentReasonsByPatientType",
      checkActiveSession,
      tokenVerified,
      this.getAppointmentReasonsByPatientTypeHandler
    );
    this._route.get(
      "/treatment/getTreatmentSheets/:startDate",
      checkActiveSession,
      tokenVerified,
      this.getTreatmentSheetsHandler
    );
    this._route.get(
      "/treatment/getTreatmentSheetsByTreatmentCycleId/:id",
      checkActiveSession,
      tokenVerified,
      this.getTreatmentSheetsByIdHandler
    );
    this._route.get(
      "/treatment/getTreatmentStatus",
      checkActiveSession,
      tokenVerified,
      this.getTreatmentStatusHandler
    );

    //POST
    this._route.post(
      "/appointments/changeAppointmentStatus",
      checkActiveSession,
      tokenVerified,
      this.changeAppointmentStatus
    );
    this._route.post(
      "/consultation/getAvailableDoctors",
      checkActiveSession,
      tokenVerified,
      this.consultationGetAvailableDoctors
    );
    this._route.post(
      "/consultation/getAvailableSlots",
      checkActiveSession,
      tokenVerified,
      this.consultationGetAvailableSlots
    );
    this._route.post(
      "/consultation/bookAppointment",
      checkActiveSession,
      tokenVerified,
      queue({ activeLimit: 1, queuedLimit: -1 }),
      this.consultationBookAppointment
    );

    this._route.post(
      "/treatment/getAvailableDoctors",
      checkActiveSession,
      tokenVerified,
      this.treatmentGetAvailableDoctors
    );
    this._route.post(
      "/treatment/getAvailableSlots",
      checkActiveSession,
      tokenVerified,
      this.treatmentGetAvailableSlots
    );
    this._route.post(
      "/treatment/bookAppointment",
      checkActiveSession,
      tokenVerified,
      queue({ activeLimit: 1, queuedLimit: -1 }),
      this.treatmentBookAppointment
    );
    this._route.post(
      "/treatment/updateTreatmentStatus",
      checkActiveSession,
      tokenVerified,
      this.updateTreatmentStatus
    );
    this._route.post(
      "/treatment/updateTreatmentSheetByTreatmentCycleId",
      checkActiveSession,
      tokenVerified,
      this.updateTreatmentSheetHandler
    );
    this._route.post(
      "/appointments/rescheduleAppointment",
      checkActiveSession,
      tokenVerified,
      this.rescheduleAppointmentHandler
    );

    //review call by doctor
    this._route.post(
      "/consultation/bookReviewAppointment",
      checkActiveSession,
      tokenVerified,
      queue({ activeLimit: 1, queuedLimit: -1 }),
      this.consultationBookReviewAppointment
    );

    this._route.post(
      "/treatment/bookReviewAppointment",
      checkActiveSession,
      tokenVerified,
      queue({ activeLimit: 1, queuedLimit: -1 }),
      this.treatmentBookReviewAppointment
    );

    //fet sheet
    this._route.get(
      "/treatment/getTreatmentFetSheetByTreatmentCycleId/:id",
      checkActiveSession,
      tokenVerified,
      this.getTreatmentFetSheetByIdHandler
    );

    this._route.post(
      "/treatment/updateTreatmentFetSheetByTreatmentCycleId",
      checkActiveSession,
      tokenVerified,
      this.updateTreatmentFetSheetHandler
    );

    //era sheet
    this._route.get(
      "/treatment/getTreatmentEraSheetByTreatmentCycleId/:id",
      checkActiveSession,
      tokenVerified,
      this.getTreatmentEraSheetByIdHandler
    );

    this._route.post(
      "/treatment/updateTreatmentEraSheetByTreatmentCycleId",
      checkActiveSession,
      tokenVerified,
      this.updateTreatmentEraSheetHandler
    );

    this._route.delete(
      "/appointments/deleteAppointment",
      checkActiveSession,
      tokenVerified,
      this.deleteAppointmentHandler
    );

    this._route.post(
      "/appointments/applyNoShow",
      checkActiveSession,
      tokenVerified,
      this.applyNoShow
    );

    //hysteroscopy
    this._route.get(
      "/treatment/getHysteroscopySheetByVisitId/:visitId",
      checkActiveSession,
      tokenVerified,
      this.getHysteroscopySheetByVisitId
    );

    this._route.post(
      "/treatment/updateHysteroscopySheetByVisitId",
      checkActiveSession,
      tokenVerified,
      this.updateHysteroscopySheetByVisitId
    );

    // prescription print
    this._route.post(
      "/printPrescription",
      checkActiveSession,
      tokenVerified,
      this.printPrescriptionRoute
    );

    // Opt Out
    this._route.post(
      "/appointments/applyOptOut",
      checkActiveSession,
      tokenVerified,
      this.applyOptOut
    );

    // Get Pending Information
    this._route.get(
      "/appointments/getPendingInformation",
      checkActiveSession,
      tokenVerified,
      this.getPendingInformation
    );

    //create other appointment reason
    this._route.post(
      "/appointments/createOtherAppointmentReason",
      checkActiveSession,
      tokenVerified,
      this.createOtherAppointmentReason
    );

    this._route.get(
      "/appointments/getAllActiveVisitAppointments/:activeVisitId",
      checkActiveSession,
      tokenVerified,
      this.getAllActiveVisitAppointments
    );
  }

  consultationGetAvailableDoctors = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.consultationGetAvailableDoctorsHandler();
  });

  consultationGetAvailableSlots = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.consultationGetAvailableSlotsHandler();
  });

  consultationBookAppointment = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.consultationBookAppointmentHandler();
  });

  getAppointmentsByDate = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.getAppointmentsByDateHandler();
  });

  getAppointmentReasonsHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.getAppointmentReasonsHandler();
  });
  getAppointmentReasonsByPatientTypeHandler = asyncHandler(
    async (req, res, next) => {
      const controllerObj = new AppointmentsPaymentController(req, res, next);
      await controllerObj.getAppointmentReasonsByPatientTypeHandler();
    }
  );

  getTreatmentSheetsHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.getTreatmentSheetsHandler();
  });
  getTreatmentSheetsByIdHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.getTreatmentSheetsByIdHandler();
  });
  getTreatmentStatusHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.getTreatmentStatusHandler();
  });

  changeAppointmentStatus = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.changeAppointmentStatusHandler();
  });

  getAppointmentsByIdHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.getAppointmentsByIdHandler();
  });

  treatmentGetAvailableDoctors = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.treatmentGetAvailableDoctorsHandler();
  });

  treatmentGetAvailableSlots = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.treatmentGetAvailableSlotsHandler();
  });

  treatmentBookAppointment = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.treatmentBookAppointmentHandler();
  });

  updateTreatmentStatus = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.updateTreatmentStatusHandler();
  });

  updateTreatmentSheetHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.updateTreatmentSheetHandler();
  });

  consultationBookReviewAppointment = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.consultationBookReviewAppointmentHandler();
  });

  treatmentBookReviewAppointment = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.treatmentBookReviewAppointmentHandler();
  });

  getTreatmentFetSheetByIdHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.getTreatmentFetSheetByIdHandler();
  });

  updateTreatmentFetSheetHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.updateTreatmentFetSheetHandler();
  });

  getTreatmentEraSheetByIdHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.getTreatmentEraSheetByIdHandler();
  });

  updateTreatmentEraSheetHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.updateTreatmentEraSheetHandler();
  });

  deleteAppointmentHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.deleteAppointmentHandler();
  });

  applyNoShow = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.applyNoShowHandler();
  });

  getHysteroscopySheetByVisitId = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.getHysteroscopySheetByVisitIdHandler();
  });

  updateHysteroscopySheetByVisitId = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.updateHysteroscopySheetByVisitIdHandler();
  });

  printPrescriptionRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.printPrescriptionHandler();
  });

  applyOptOut = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.applyOptOutHandler();
  });

  getPendingInformation = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.getPendingInformationHandler();
  });

  rescheduleAppointmentHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.rescheduleAppointmentHandler();
  });

  createOtherAppointmentReason = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.createOtherAppointmentReasonHandler();
  });

  getAllActiveVisitAppointments = asyncHandler(async (req, res, next) => {
    const controllerObj = new AppointmentsPaymentController(req, res, next);
    await controllerObj.getAllActiveVisitAppointmentsHandler();
  });
}

module.exports = AppointmentPaymentRoute;
