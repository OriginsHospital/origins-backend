const express = require("express");
const VitalsController = require("../controllers/vitalsController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class VitalsRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get("/getVitalsDetails",  checkActiveSession, tokenVerified, this.getVitalDetails);
    this._route.post("/saveVitalsDetails", checkActiveSession, tokenVerified, this.saveVitalsDetails);
    this._route.post("/editVitalsDetails", checkActiveSession, tokenVerified, this.editVitalsDetails);
  }

  getVitalDetails = asyncHandler(async (req, res, next) => {
    const controllerObj = new VitalsController(req, res, next);
    await controllerObj.getVitalDetailsHandler();
  });

  saveVitalsDetails = asyncHandler(async (req, res, next) => {
    const controllerObj = new VitalsController(req, res, next);
    await controllerObj.saveVitalsHandler();
  });

  editVitalsDetails = asyncHandler(async (req, res, next) => {
    const controllerObj = new VitalsController(req, res, next);
    await controllerObj.editVitalsHandler();
  });

}

module.exports = VitalsRoute;
