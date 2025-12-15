const express = require("express");
const IcsiController = require("../controllers/icsiController.js");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const multer = require("multer");
const upload = multer();

class IcsiRoute {
  _route = express.Router();

  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/getIcsiConsentsByVisitId/:visitId",
      checkActiveSession,
      tokenVerified,
      this.getIcsiConsentsByVisitId
    );

    this._route.post(
      "/uploadIcsiConsent",
      checkActiveSession,
      tokenVerified,
      upload.fields([{ name: "icsiConsent", maxCount: 1 }]),
      this.uploadIcsiConsent
    );

    this._route.delete(
      "/deleteIcsiConsent/:id",
      checkActiveSession,
      tokenVerified,
      this.deleteIcsiConsentByVisitId
    );

    this._route.put(
      "/reviewIcsiConsents/:id",
      checkActiveSession,
      tokenVerified,
      this.reviewIcsiConsents
    );

    this._route.post(
      "/startTrigger",
      checkActiveSession,
      tokenVerified,
      this.startTrigger
    );

    //hysteroscopy APIS
    // POST startHysteroscopy -> visitId , TreatmentType ,date -> create OT on that date and give back the sheet 
    //getHysteroscopyTreatmentSheetsByTreatmentCycleId
    //updateTreatmentSheetByTreatmentCycleId

    this._route.get(
      "/getEraConsentsByVisitId/:visitId",
      checkActiveSession,
      tokenVerified,
      this.getEraConsentsByVisitId
    );

    this._route.post(
      "/uploadEraConsent",
      checkActiveSession,
      tokenVerified,
      upload.fields([{ name: "eraConsent", maxCount: 1 }]),
      this.uploadEraConsent
    );

    this._route.delete(
      "/deleteEraConsent/:id",
      checkActiveSession,
      tokenVerified,
      this.deleteEraConsentByVisitId
    );

    this._route.put(
      "/reviewEraConsents/:id",
      checkActiveSession,
      tokenVerified,
      this.reviewEraConsents
    );
    
  }

  getIcsiConsentsByVisitId = asyncHandler(async (req, res, next) => {
    const controllerObj = new IcsiController(req, res, next);
    await controllerObj.getIcsiConsentsByVisitIdHandler();
  });

  uploadIcsiConsent = asyncHandler(async (req, res, next) => {
    const controllerObj = new IcsiController(req, res, next);
    await controllerObj.uploadIcsiConsentHandler();
  });

  deleteIcsiConsentByVisitId = asyncHandler(async (req, res, next) => {
    const controllerObj = new IcsiController(req, res, next);
    await controllerObj.deleteIcsiConsentByVisitIdHandler();
  });

  reviewIcsiConsents = asyncHandler(async (req, res, next) => {
    const controllerObj = new IcsiController(req, res, next);
    await controllerObj.reviewIcsiConsentsHandler();
  });

  startTrigger = asyncHandler(async (req, res, next) => {
    const controllerObj = new IcsiController(req, res, next);
    await controllerObj.startTriggerHandler();
  });

  //ERA CONSENTS AND REVIE
  getEraConsentsByVisitId = asyncHandler(async (req, res, next) => {
    const controllerObj = new IcsiController(req, res, next);
    await controllerObj.getEraConsentsByVisitIdHandler();
  });

  uploadEraConsent = asyncHandler(async (req, res, next) => {
    const controllerObj = new IcsiController(req, res, next);
    await controllerObj.uploadEraConsentHandler();
  });

  deleteEraConsentByVisitId = asyncHandler(async (req, res, next) => {
    const controllerObj = new IcsiController(req, res, next);
    await controllerObj.deleteEraConsentByVisitIdHandler();
  });

  reviewEraConsents = asyncHandler(async (req, res, next) => {
    const controllerObj = new IcsiController(req, res, next);
    await controllerObj.reviewEraConsentsHandler();
  } );
}

module.exports = IcsiRoute;
