const express = require("express");
const PatientsController = require("../controllers/patientsController.js");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const multer = require("multer");
const upload = multer();
class PatientsRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/searchPatient/:data",
      checkActiveSession,
      tokenVerified,
      this.searchPatientRoute
    );
    this._route.post(
      "/createPatient",
      checkActiveSession,
      tokenVerified,
      upload.fields([
        { name: "file", maxCount: 1 },
        { name: "uploadedDocuments", maxCount: 10 },
        { name: "aadhaarCard", maxCount: 1 },
        { name: "marriageCertificate", maxCount: 1 },
        { name: "affidavit", maxCount: 1 }
      ]),
      this.createPatientRoute
    );
    this._route.post(
      "/createGuardian",
      checkActiveSession,
      tokenVerified,
      this.createGuardianRoute
    );
    this._route.get(
      "/getPatients",
      checkActiveSession,
      tokenVerified,
      this.getPatientsRoute
    );
    this._route.get(
      "/getDateFilteredPatients",
      checkActiveSession,
      tokenVerified,
      this.getDateFilteredPatientsRoute
    );
    this._route.get("/getpatientDetails/:id", this.getPatientDetailsRoute);
    this._route.put(
      "/editPatient",
      checkActiveSession,
      tokenVerified,
      upload.fields([
        { name: "file", maxCount: 1 },
        { name: "uploadedDocuments", maxCount: 10 },
        { name: "aadhaarCard", maxCount: 1 },
        { name: "marriageCertificate", maxCount: 1 },
        { name: "affidavit", maxCount: 1 }
      ]),
      this.editPatientRoute
    );
    this._route.put(
      "/editGuardian",
      checkActiveSession,
      tokenVerified,
      this.editGuardianRoute
    );
    this._route.delete("/deletePatient/:id", this.deletePatientRoute);

    this._route.get(
      "/getFormFTemplate",
      checkActiveSession,
      tokenVerified,
      this.getFormFTemplate
    );

    this._route.get(
      "/getOpdSheetByPatientId/:id",
      checkActiveSession,
      tokenVerified,
      this.getOpdSheetByPatientId
    );

    this._route.post(
      "/saveOpdSheet",
      checkActiveSession,
      tokenVerified,
      this.saveOpdSheet
    );

    this._route.get(
      "/getDischargeSummarySheetByTreatmentId/:id",
      checkActiveSession,
      tokenVerified,
      this.getDischargeSummarySheetByTreatmentId
    );

    this._route.post(
      "/saveDischargeSummarySheet",
      checkActiveSession,
      tokenVerified,
      this.saveDischargeSummarySheet
    );

    this._route.get(
      "/getPickUpSheetByTreatmentId/:id",
      checkActiveSession,
      tokenVerified,
      this.getPickUpSheetByTreatmentId
    );

    this._route.post(
      "/savePickUpSheet",
      checkActiveSession,
      tokenVerified,
      this.savePickUpSheet
    );

    this._route.get(
      "/getPatientTreatmentCycles",
      checkActiveSession,
      tokenVerified,
      this.getPatientTreatmentCycles
    );

    this._route.get(
      "/downloadOpdSheetByPatientId/:id",
      checkActiveSession,
      tokenVerified,
      this.downloadOpdSheetByPatientId
    );

  }

  searchPatientRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.searchPatientHandler();
  });

  createPatientRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.createPatientHandler();
  });

  createGuardianRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.createGuardianHandler();
  });

  getPatientsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.getPatientsHandler();
  });

  getDateFilteredPatientsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.getDateFilteredPatientsHandler();
  });

  getPatientDetailsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.getPatientDetailsHandler();
  });

  editPatientRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.editPatientHandler();
  });

  editGuardianRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.editGuardianHandler();
  });

  deletePatientRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.deletePatientHandler();
  });

  getFormFTemplate = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.getFormFTemplateHandler();
  });

  getOpdSheetByPatientId = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.getOpdSheetByPatientIdHandler();
  });

  saveOpdSheet = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.saveOpdSheetHandler();
  });

  getDischargeSummarySheetByTreatmentId = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.getDischargeSummarySheetByTreatmentIdHandler();
  });

  saveDischargeSummarySheet = asyncHandler(async (req,res,next) =>{
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.saveDischargeSummarySheetHandler();
  })

  getPickUpSheetByTreatmentId = asyncHandler(async (req,res,next) =>{
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.getPickUpSheetByTreatmentIdHandler();
  })

  savePickUpSheet = asyncHandler(async (req,res,next) =>{
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.savePickUpSheetHandler();
  })

  getPatientTreatmentCycles = asyncHandler(async (req,res,next) =>{
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.getPatientTreatmentCyclesHandler();
  })

  downloadOpdSheetByPatientId = asyncHandler(async (req,res,next) =>{
    const controllerObj = new PatientsController(req, res, next);
    await controllerObj.downloadOpdSheedByPatientIdHandler();
  })
}

module.exports = PatientsRoute;
