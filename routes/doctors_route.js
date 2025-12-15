const express = require("express");
const DoctorsController = require("../controllers/doctorsController.js");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class DoctorsRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.post(
      "/saveDoctorAvailability",
      checkActiveSession,
      tokenVerified,
      this.createDoctorRoute
    );
    this._route.get(
      "/getDoctorsForAvailability",
      checkActiveSession,
      tokenVerified,
      this.getAvailabilityDoctorRoute
    );
    this._route.post(
      "/createLineBillsAndNotesForAppointment",
      checkActiveSession,
      tokenVerified,
      this.createLineBillsAndNotesForAppointmentRoute
    );
    this._route.get(
      "/getLineBillsAndNotesForAppointment",
      checkActiveSession,
      tokenVerified,
      this.getLineBillsAndNotesForAppointmentRoute
    );
    this._route.get(
      "/getAppointmentsByDate/:date",
      checkActiveSession,
      tokenVerified,
      this.getAppointsmentByDateRoute
    );
    //doctor Appointments - Search By Patient Id
    this._route.get(
      "/getAppointmentsByPatient/:patientId",
      checkActiveSession,
      tokenVerified,
      this.getAppointmentsByPatientRoute
    );
    this._route.get(
      "/getPatientInformation/:patientId",
      checkActiveSession,
      tokenVerified,
      this.getPatientHistoryRoute
    );
    this._route.get(
      "/getAppointmentHistory",
      checkActiveSession,
      tokenVerified,
      this.getAppointmentHistoryRoute
    );

    this._route.get(
      "/shiftChangeRequestHistory",
      checkActiveSession,
      tokenVerified,
      this.getShiftRequestHistoryRoute
    );
    this._route.post(
      "/shiftChangeRequest",
      checkActiveSession,
      tokenVerified,
      this.shiftChangeRequestRoute
    );

    this._route.get(
      "/getCheckListSheetByPatientId/:patientId",
      checkActiveSession,
      tokenVerified,
      this.getCheckListSheetByPatientIdRoute
    );

    this._route.get(
      "/getEmbryologyHistoryByPatientId/:patientId",
      checkActiveSession,
      tokenVerified,
      this.getEmbryologyHistoryByPatientIdRoute
    );

    // isCompleted from doctor screen
    this._route.post(
      "/setIsCompletedForAppointment",
      checkActiveSession,
      tokenVerified,
      this.setIsCompletedForAppointmentRoute
    );
  }

  createDoctorRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new DoctorsController(req, res, next);
    await controllerObj.createdoctorHandler();
  });

  getAvailabilityDoctorRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new DoctorsController(req, res, next);
    await controllerObj.getAvailabilityDoctorHandler();
  });

  createLineBillsAndNotesForAppointmentRoute = asyncHandler(
    async (req, res, next) => {
      const controllerObj = new DoctorsController(req, res, next);
      await controllerObj.createLineBillsAndNotesForAppointmentHandler();
    }
  );

  getLineBillsAndNotesForAppointmentRoute = asyncHandler(
    async (req, res, next) => {
      const controllerObj = new DoctorsController(req, res, next);
      await controllerObj.getLineBillsAndNotesForAppointmentHandler();
    }
  );

  getAppointsmentByDateRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new DoctorsController(req, res, next);
    await controllerObj.getAppointsmentsByDateHandler();
  });

  getAppointmentsByPatientRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new DoctorsController(req, res, next);
    await controllerObj.getAppointmentsByPatientHandler();
  });

  getPatientHistoryRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new DoctorsController(req, res, next);
    await controllerObj.getPatientHistoryHandler();
  });

  getAppointmentHistoryRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new DoctorsController(req, res, next);
    await controllerObj.getAppointmentHistoryHandler();
  });

  getShiftRequestHistoryRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new DoctorsController(req, res, next);
    await controllerObj.getShiftRequestHistoryHandler();
  });

  shiftChangeRequestRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new DoctorsController(req, res, next);
    await controllerObj.shiftChangeRequestHandler();
  });

  getCheckListSheetByPatientIdRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new DoctorsController(req, res, next);
    await controllerObj.getCheckListSheetByPatientIdHandler();
  });

  getEmbryologyHistoryByPatientIdRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new DoctorsController(req, res, next);
    await controllerObj.getPatientEmbryologyHistory();
  });

  setIsCompletedForAppointmentRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new DoctorsController(req, res, next);
    await controllerObj.setIsCompletedForAppointmentHandler();
  });
}

module.exports = DoctorsRoute;
