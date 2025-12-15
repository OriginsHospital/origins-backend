const express = require("express");
const ConsultantRoasterController = require("../controllers/consultantRoasterController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class ConsultantRoasterRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/getAllConsultantRoasters",
      checkActiveSession,
      tokenVerified,
      this.getAllConsultantRoastersRoute
    );

    this._route.post(
      "/createConsultantRoaster",
      checkActiveSession,
      tokenVerified,
      this.createConsultantRoasterRoute
    );
    
    this._route.put(
      "/editConsultantRoaster",
      checkActiveSession,
      tokenVerified,
      this.editConsultantRoaster
    );
  }

  getAllConsultantRoastersRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new ConsultantRoasterController(req, res, next);
    await controllerObj.getAllConsultantRoastersHandler();
  });

  createConsultantRoasterRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new ConsultantRoasterController(req, res, next);
    await controllerObj.createConsultantRoasterHandler();
  });

  editConsultantRoaster = asyncHandler(async (req, res, next) => {
    const controllerObj = new ConsultantRoasterController(req, res, next);
    await controllerObj.editConsultantRoasterHandler();
  });

}

module.exports = ConsultantRoasterRoute;
