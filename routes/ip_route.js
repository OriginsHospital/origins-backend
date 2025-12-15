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

    // ========== LAYOUT MANAGEMENT ROUTES ==========
    
    // State routes
    this._route.post("/layout/state", checkActiveSession, tokenVerified, this.createStateRoute);
    this._route.get("/layout/states", checkActiveSession, tokenVerified, this.getStatesRoute);
    this._route.put("/layout/state/:id", checkActiveSession, tokenVerified, this.updateStateRoute);

    // City routes
    this._route.post("/layout/city", checkActiveSession, tokenVerified, this.createCityRoute);
    this._route.get("/layout/cities", checkActiveSession, tokenVerified, this.getCitiesRoute);
    this._route.put("/layout/city/:id", checkActiveSession, tokenVerified, this.updateCityRoute);

    // Branch routes
    this._route.post("/layout/branch", checkActiveSession, tokenVerified, this.createBranchRoute);
    this._route.get("/layout/branches", checkActiveSession, tokenVerified, this.getBranchesRoute);
    this._route.put("/layout/branch/:id", checkActiveSession, tokenVerified, this.updateBranchRoute);

    // Building routes
    this._route.post("/layout/building", checkActiveSession, tokenVerified, this.createBuildingRoute);
    this._route.put("/layout/building/:id", checkActiveSession, tokenVerified, this.updateBuildingRoute);

    // Floor routes
    this._route.post("/layout/floor", checkActiveSession, tokenVerified, this.createFloorRoute);
    this._route.put("/layout/floor/:id", checkActiveSession, tokenVerified, this.updateFloorRoute);
    this._route.delete("/layout/floor/:id", checkActiveSession, tokenVerified, this.deleteFloorRoute);

    // Room routes
    this._route.post("/layout/room", checkActiveSession, tokenVerified, this.createRoomRoute);
    this._route.put("/layout/room/:id", checkActiveSession, tokenVerified, this.updateRoomRoute);
    this._route.delete("/layout/room/:id", checkActiveSession, tokenVerified, this.deleteRoomRoute);

    // Bed routes
    this._route.post("/layout/bed", checkActiveSession, tokenVerified, this.createBedRoute);
    this._route.post("/layout/beds/bulk", checkActiveSession, tokenVerified, this.createBedsBulkRoute);
    this._route.put("/layout/bed/:id", checkActiveSession, tokenVerified, this.updateBedRoute);
    this._route.delete("/layout/bed/:id", checkActiveSession, tokenVerified, this.deleteBedRoute);

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

  // ========== LAYOUT MANAGEMENT ROUTES ==========

  // State routes
  createStateRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.createStateHandler();
  });

  getStatesRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.getStatesHandler();
  });

  updateStateRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.updateStateHandler();
  });

  // City routes
  createCityRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.createCityHandler();
  });

  getCitiesRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.getCitiesHandler();
  });

  updateCityRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.updateCityHandler();
  });

  // Branch routes
  createBranchRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.createBranchHandler();
  });

  getBranchesRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.getBranchesHandler();
  });

  updateBranchRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.updateBranchHandler();
  });

  // Building routes
  createBuildingRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.createBuildingHandler();
  });

  updateBuildingRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.updateBuildingHandler();
  });

  // Floor routes
  createFloorRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.createFloorHandler();
  });

  updateFloorRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.updateFloorHandler();
  });

  deleteFloorRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.deleteFloorHandler();
  });

  // Room routes
  createRoomRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.createRoomHandler();
  });

  updateRoomRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.updateRoomHandler();
  });

  deleteRoomRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.deleteRoomHandler();
  });

  // Bed routes
  createBedRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.createBedHandler();
  });

  createBedsBulkRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.createBedsBulkHandler();
  });

  updateBedRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.updateBedHandler();
  });

  deleteBedRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new IpController(req, res, next);
    await controllerObj.deleteBedHandler();
  });
}

module.exports = OtherPaymentModuleRoutes;