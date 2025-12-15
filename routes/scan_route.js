const express = require("express");
const ScanController = require("../controllers/scanController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const multer = require("multer");
const upload = multer();

class ScanRoute {
  _route = express.Router();

  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get( "/getScansByDate/:appointmentDate", checkActiveSession, tokenVerified, this.getScansByDate );
    this._route.get( "/getScanTemplate/:id", checkActiveSession, tokenVerified, this.getScanTemplateById );
    this._route.post( "/saveScanResult", checkActiveSession, tokenVerified, this.saveScanResult );
    this._route.get( "/getSavedScanResult", checkActiveSession, tokenVerified, this.getSavedScanResult );
    this._route.post( "/uploadFormFForScans", checkActiveSession, tokenVerified, upload.fields([{ name: "formF", maxCount: 1 }]), this.uploadFormFForScans );
    this._route.delete( "/deleteFormFForScans", checkActiveSession, tokenVerified, this.deleteFormFForScans );
    this._route.get( "/downloadSampleFormFTemplate", checkActiveSession, tokenVerified, this.downloadSampleFormFTemplate );
    this._route.put("/reviewFormFTemplate", checkActiveSession, tokenVerified, this.reviewFormFTemplate);
    this._route.get( "/getFormFTemplateByDateRange", checkActiveSession, tokenVerified, this.getFormTemplateByDateRange );
    this._route.get( "/downloadScanReport", checkActiveSession, tokenVerified, this.downloadScanReport );
  }

  getScansByDate = asyncHandler(async (req, res, next) => {
    const controllerObj = new ScanController(req, res, next);
    await controllerObj.getScansByDateHandler();
  });

  getScanTemplateById = asyncHandler(async (req, res, next) => {
    const controllerObj = new ScanController(req, res, next);
    await controllerObj.getScanTemplateByIdHandler();
  });

  saveScanResult = asyncHandler(async (req, res, next) => {
    const controllerObj = new ScanController(req, res, next);
    await controllerObj.saveScanResultHandler();
  });

  getSavedScanResult = asyncHandler(async (req, res, next) => {
    const controllerObj = new ScanController(req, res, next);
    await controllerObj.getSavedScanResult();
  });

  uploadFormFForScans = asyncHandler(async (req, res, next) => {
    const controllerObj = new ScanController(req, res, next);
    await controllerObj.uploadFormFForScansHandler();
  });

  deleteFormFForScans =asyncHandler(async (req, res, next) => {
    const controllerObj = new ScanController(req, res, next);
    await controllerObj.deleteFormFForScansHandler();
  });

  downloadSampleFormFTemplate = asyncHandler(async (req, res, next) => {
    const controllerObj = new ScanController(req, res, next);
    await controllerObj.downloadFormFSampleTemplateHandler();
  });

  reviewFormFTemplate = asyncHandler(async (req, res, next) => {
    const controllerObj = new ScanController(req, res, next);
    await controllerObj.reviewFormFTemplateController();
    
  });

  getFormTemplateByDateRange = asyncHandler(async (req, res, next) => {
    const controllerObj = new ScanController(req, res, next);
    await controllerObj.getFormTemplateByDateRangeController();
    
  });

  downloadScanReport = asyncHandler(async (req,res,next) => {
    const controllerObj = new ScanController(req, res, next);
    await controllerObj.downloadScanReportHandler();
  })

}

module.exports = ScanRoute;
