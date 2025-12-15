const express = require("express");
const LabsController = require("../controllers/labsController.js");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const multer = require("multer");
const upload = multer();

class LabsRoute {
  _route = express.Router();

  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/getLabTestsByDate/:appointmentDate",
      checkActiveSession,
      tokenVerified,
      this.getLabtestsByDate
    );

    //getAllInhouseLabTests (for grid data)
    this._route.get(
      "/getAllLabTests",
      checkActiveSession,
      tokenVerified,
      this.getAllLabTests
    );

    //getAllOutsourcingLabTests
    this._route.get(
      "/getAllOutsourcingLabTests",
      checkActiveSession,
      tokenVerified,
      this.getAllOutsourcingLabTests
    );

    this._route.get(
      "/getLabTestTemplate",
      checkActiveSession,
      tokenVerified,
      this.getLabTestTemplateById
    );
    this._route.post(
      "/saveLabTestResult",
      checkActiveSession, 
      tokenVerified,
      this.saveLabTestResult
    );
    this._route.post(
      "/saveOutsourcingLabTestResult",
      checkActiveSession, 
      tokenVerified,
      upload.fields([{ name: "labTestResultFile", maxCount: 1 }]),
      this.saveOutsourcingLabTestResult
    );
    this._route.get(
      "/getSavedLabTestResult",
      checkActiveSession,
      tokenVerified,
      this.getSavedLabTestResult
    );

    this._route.put(
      "/deleteLabOursourcingTestResult/:labTestResultId",
      checkActiveSession,
      tokenVerified,
      this.deleteLabOursourcingTestResult
    );

    this._route.get(
      "/downloadLabReport", 
      checkActiveSession, 
      tokenVerified, 
      this.downloadLabReport 
    );
  }

  getLabtestsByDate = asyncHandler(async (req, res, next) => {
    const controllerObj = new LabsController(req, res, next);
    await controllerObj.getLabtestsByDateHandler();
  });

  getAllLabTests = asyncHandler(async (req, res, next) => {
    const controllerObj = new LabsController(req, res, next);
    await controllerObj.getAllLabTestsHandler();
  });

  getAllOutsourcingLabTests = asyncHandler(async (req, res, next) => {
    const controllerObj = new LabsController(req, res, next);
    await controllerObj.getAllOutsourcingLabTestsHandler();
  });

  getLabTestTemplateById = asyncHandler(async (req, res, next) => {
    const controllerObj = new LabsController(req, res, next);
    await controllerObj.getLabTestTemplateByIdHandler();
  });

  saveLabTestResult = asyncHandler(async (req, res, next) => {
    const controllerObj = new LabsController(req, res, next);
    await controllerObj.saveLabTestResultHandler();
  });

  saveOutsourcingLabTestResult  = asyncHandler(async (req, res, next) => {
    const controllerObj = new LabsController(req, res, next);
    await controllerObj.saveOutsourcingLabTestResultHandler();
  });

  getSavedLabTestResult = asyncHandler(async (req, res, next) => {
    const controllerObj = new LabsController(req, res, next);
    await controllerObj.getSavedLabTestResultHandler();
  });

  deleteLabOursourcingTestResult = asyncHandler(async (req, res, next) => {
    const controllerObj = new LabsController(req, res, next);
    await controllerObj.deleteLabOursourcingTestResultHandler();
  });

  downloadLabReport = asyncHandler(async (req, res, next) => {
    const controllerObj = new LabsController(req, res, next);
    await controllerObj.downloadLabReportHandler();
  });
}

module.exports = LabsRoute;
