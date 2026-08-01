const express = require("express");
const PatientTrackerController = require("../controllers/patientTrackerController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class PatientTrackerRoute {
  _route = express.Router();

  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/all",
      checkActiveSession,
      tokenVerified,
      this.getAllPatientTrackerRoute
    );

    this._route.get(
      "/summary-automated",
      checkActiveSession,
      tokenVerified,
      this.getSummaryAutomatedRoute
    );

    this._route.get(
      "/by-patient/:patientId",
      checkActiveSession,
      tokenVerified,
      this.getByPatientIdRoute
    );

    this._route.post(
      "/create",
      checkActiveSession,
      tokenVerified,
      this.createPatientTrackerRoute
    );

    this._route.put(
      "/edit",
      checkActiveSession,
      tokenVerified,
      this.editPatientTrackerRoute
    );
  }

  getAllPatientTrackerRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientTrackerController(req, res, next);
    await controllerObj.getAllPatientTrackerHandler();
  });

  getSummaryAutomatedRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientTrackerController(req, res, next);
    await controllerObj.getSummaryAutomatedHandler();
  });

  getByPatientIdRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientTrackerController(req, res, next);
    await controllerObj.getByPatientIdHandler();
  });

  createPatientTrackerRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientTrackerController(req, res, next);
    await controllerObj.createPatientTrackerHandler();
  });

  editPatientTrackerRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientTrackerController(req, res, next);
    await controllerObj.editPatientTrackerHandler();
  });
}

module.exports = PatientTrackerRoute;
