const express = require("express");
const IuiController = require("../controllers/iuiController.js");
const { asyncHandler } = require("../middlewares/errorHandlers.js");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const multer = require("multer");
const upload = multer();

class IuiRoute {
  _route = express.Router();

  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/getIuiConsentsByVisitId/:visitId",
      checkActiveSession,
      tokenVerified,
      this.getIuiConsentsByVisitId
    );

    this._route.post(
      "/uploadIuiConsent",
      checkActiveSession,
      tokenVerified,
      upload.fields([{ name: "iuiConsent", maxCount: 1 }]),
      this.uploadIuiConsent
    );

    this._route.delete(
      "/deleteIuiConsent/:id",
      checkActiveSession,
      tokenVerified,
      this.deleteIuiConsentByVisitId
    );

    //review iui

    //start iui trigger
  }

  getIuiConsentsByVisitId = asyncHandler(async (req, res, next) => {
    const controllerObj = new IuiController(req, res, next);
    await controllerObj.getIuiConsentsByVisitIdHandler();
  });

  uploadIuiConsent = asyncHandler(async (req, res, next) => {
    const controllerObj = new IuiController(req, res, next);
    await controllerObj.uploadIuiConsentHandler();
  });

  deleteIuiConsentByVisitId = asyncHandler(async (req, res, next) => {
    const controllerObj = new IuiController(req, res, next);
    await controllerObj.deleteIuiConsentByVisitIdHandler();
  });
}

module.exports = IuiRoute;
