const express = require("express");
const TimeSlotsController = require("../controllers/timeSlotsController");
const {
  tokenVerified,
  checkActiveSession
} = require("../middlewares/authMiddlewares");
const { asyncHandler } = require("../middlewares/errorHandlers");

class TimeSlotsRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/getDoctorsList",
      checkActiveSession,
      tokenVerified,
      this.getDoctorsListRoute
    );
    this._route.post(
      "/getBlockedTimeSlots",
      checkActiveSession,
      tokenVerified,
      this.getBlockedTimeSlotsRoute
    );
    this._route.post(
      "/saveBlockedTimeSlots",
      checkActiveSession,
      tokenVerified,
      this.saveBlockedTimeSlotsRoute
    );
  }

  getDoctorsListRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TimeSlotsController(req, res, next);
    await controllerObj.getDoctorsListHandler();
  });

  saveBlockedTimeSlotsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TimeSlotsController(req, res, next);
    await controllerObj.blockTimeSlotsHandler();
  });

  getBlockedTimeSlotsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TimeSlotsController(req, res, next);
    await controllerObj.getBlockedTimeSlotsHandler();
  });
}

module.exports = TimeSlotsRoute;
