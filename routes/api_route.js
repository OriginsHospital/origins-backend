const express = require("express");
const ApiController = require("../controllers/apiController");
const { asyncHandler } = require("../middlewares/errorHandlers");

class ApiRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get("/dropdownOptions", this.dropdownOptionsRoute);
    this._route.get("/undoIcsi/:patientId", this.undoIcsiRoute);
    this._route.get("/getCities/:stateId", this.getCitiesRoute);
    this._route.get(
      "/getBillTypeValues/:billTypeId",
      this.getBillTypeValuesRoute
    );
    this._route.get("/getTreatmentTypes", this.getTreatmentTypesRoute);
    this._route.get("/getAllCities", this.getAllCitiesRoute);
  }

  dropdownOptionsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new ApiController(req, res, next);
    await controllerObj.dropdownOptionsHandler();
  });

  getCitiesRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new ApiController(req, res, next);
    await controllerObj.getCitiesHandler();
  });

  getBillTypeValuesRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new ApiController(req, res, next);
    await controllerObj.getBillTypeValuesHandler();
  });

  undoIcsiRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new ApiController(req, res, next);
    await controllerObj.undoIcsiHandler();
  });

  getTreatmentTypesRoute = asyncHandler(async (req,res,next) => {
    const controllerObj = new ApiController(req, res, next);
    await controllerObj.getTreatmentTypesHandler();
  })

  getAllCitiesRoute = asyncHandler(async (req,res,next) => {
    const controllerObj = new ApiController(req, res, next);
    await controllerObj.getAllCitiesHandler();
  })
}

module.exports = ApiRoute;
