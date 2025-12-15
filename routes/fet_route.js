const express = require("express");
const FetController = require("../controllers/fetController.js");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const multer = require("multer");
const upload = multer();

class FetRoute {
  _route = express.Router();

  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/getFetConsentsByVisitId/:visitId",
      checkActiveSession,
      tokenVerified,
      this.getFetConsentsByVisitId
    );

    this._route.post(
      "/uploadFetConsent",
      checkActiveSession,
      tokenVerified,
      upload.fields([{ name: "fetConsent", maxCount: 1 }]),
      this.uploadFetConsent
    );

    this._route.delete(
      "/deleteFetConsent/:id",
      checkActiveSession,
      tokenVerified,
      this.deleteFetConsentByVisitId
    );

    this._route.put(
      "/reviewFetConsents/:id",
      checkActiveSession,
      tokenVerified,
      this.reviewFetConsents
    );

  }

  getFetConsentsByVisitId = asyncHandler(async (req, res, next) => {
    const controllerObj = new FetController(req, res, next);
    await controllerObj.getFetConsentsByVisitIdHandler();
  });

  uploadFetConsent = asyncHandler(async (req, res, next) => {
    const controllerObj = new FetController(req, res, next);
    await controllerObj.uploadFetConsentHandler();
  });

  deleteFetConsentByVisitId = asyncHandler(async (req, res, next) => {
    const controllerObj = new FetController(req, res, next);
    await controllerObj.deleteFetConsentByVisitIdHandler();
  });

  reviewFetConsents = asyncHandler(async (req, res, next) => {
    const controllerObj = new FetController(req, res, next);
    await controllerObj.reviewFetConsentsHandler();
  });

}

module.exports = FetRoute;
