const express = require("express");
const UptResultsController = require("../controllers/uptResultsController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class UptResultsRoute {
  _route = express.Router();

  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/",
      checkActiveSession,
      tokenVerified,
      this.getUptResults
    );

    this._route.post(
      "/",
      checkActiveSession,
      tokenVerified,
      this.saveUptResult
    );

    this._route.put(
      "/",
      checkActiveSession,
      tokenVerified,
      this.editUptResult
    );
  }

  getUptResults = asyncHandler(async (req, res, next) => {
    const controllerObj = new UptResultsController(req, res, next);
    await controllerObj.getUptResultsHandler();
  });

  saveUptResult = asyncHandler(async (req, res, next) => {
    const controllerObj = new UptResultsController(req, res, next);
    await controllerObj.saveUptResultHandler();
  });

  editUptResult = asyncHandler(async (req, res, next) => {
    const controllerObj = new UptResultsController(req, res, next);
    await controllerObj.editUptResultHandler();
  });
}

module.exports = UptResultsRoute;
