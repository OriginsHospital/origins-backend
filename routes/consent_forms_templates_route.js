const express = require("express");
const ConsentFormsTemplateController = require("../controllers/consentFormsTemplatesController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
    checkActiveSession,
    tokenVerified
  } = require("../middlewares/authMiddlewares.js");

class ConsentFormsTemplatesRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get("/getConsentFormsList",  checkActiveSession, tokenVerified, this.getConsentFormsList);

    this._route.get("/downloadConsentFormById",  checkActiveSession, tokenVerified, this.downloadConsentFormById);
  }

  getConsentFormsList = asyncHandler(async (req, res, next) => {
    const controllerObj = new ConsentFormsTemplateController(req, res, next);
    await controllerObj.getConsentFormsListHandler();
  });

  downloadConsentFormById = asyncHandler(async (req, res, next) => {
    const controllerObj = new ConsentFormsTemplateController(req, res, next);
    await controllerObj.downloadConsentFormByIdHandler();
  });
}

module.exports = ConsentFormsTemplatesRoute;
