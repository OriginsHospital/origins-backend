const express = require("express");
const IpController = require("../controllers/ipController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  tokenVerified,
  checkActiveSession
} = require("../middlewares/authMiddlewares");

class OtherPaymentModuleRoutes {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/getIndentDetails",
      checkActiveSession,
      tokenVerified,
      this.getIndentDetailsRoute
    );

    this._route.post(
      "/addNewIndent",
      checkActiveSession,
      tokenVerified,
      this.addNewIndentRoute
    );

    //Room Hierarchy Routes
    this._route.get(
      "/getBuildings/:branchId",
      checkActiveSession,
      tokenVerified,
      this.getBuildingsRoute
    );

    this._route.get(
      "/getFloors/:buildingId",
      checkActiveSession,
      tokenVerified,
      this.getFloorsRoute
    );

    this._route.get(
      "/getRoom/:floorId",
      checkActiveSession,
      tokenVerified,
      this.getRoomRoute
    );

    this._route.get(
      "/getBeds/:roomId",
      checkActiveSession,
      tokenVerified,
      this.getBedsRoute
    );

    this._route.post(
      "/createIPRegistration",
      checkActiveSession,
      tokenVerified,
      this.createIPRegistrationRoute
    );

    this._route.get("/getActiveIP", checkActiveSession, tokenVerified, this.getActiveIPRoute);
    this._route.get("/getClosedIP", checkActiveSession, tokenVerified, this.getClosedIPRoute);
    this._route.get("/getIPDataById", checkActiveSession, tokenVerified, this.getIPDataByIdRoute);
    this._route.post("/createIPNotes", checkActiveSession, tokenVerified, this.createIPNotesRoute);
    this._route.get("/getIPNotesHistoryById", checkActiveSession, tokenVerified, this.getIPNotesHistoryByIdRoute);
    this._route.get("/closeIpRegistration", checkActiveSession, tokenVerified, this.closeIpRegistrationRoute);
    this._route.post("/ipRoomChange", checkActiveSession, tokenVerified, this.ipRoomChangeRoute);

  }

  getIndentDetailsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.getIndentDetailsHandler();
  });

  addNewIndentRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.addNewIndentHandler();
  });

  getBuildingsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.getBuildingsHandler();
  });

  getFloorsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.getFloorsHandler();
  });

  getRoomRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.getRoomHandler();
  });

  getBedsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.getBedsHandler();
  });

  createIPRegistrationRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.createIPRegistrationHandler();
  });

  getActiveIPRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.getActiveIPHandler();
  });

  getClosedIPRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.getClosedIPHandler();
  });

  getIPDataByIdRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.getIPDataByIdHandler();
  });

  createIPNotesRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.createIPNotesHandler();
  });

  getIPNotesHistoryByIdRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.getIPNotesHistoryByIdHandler();
  });

  closeIpRegistrationRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.closeIpRegistrationHandler();
  });

  ipRoomChangeRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.ipRoomChangeHandler();
  });
}

module.exports = OtherPaymentModuleRoutes;