const express = require("express");
const OtModuleController = require("../controllers/otModuleController.js");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class LabsRoute {
  _route = express.Router();

  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
        "/getAllPersonsList",
        checkActiveSession,
        tokenVerified,
        this.getAllPersonsList
      );
    
    this._route.get(
      "/getAllPersonsListDesignationWise",
      checkActiveSession,
      tokenVerified,
      this.getAllPersonsListDesignationWise
    )

    this._route.post(
      "/savePersonDetails",
      checkActiveSession,
      tokenVerified,
      this.savePersonList
    );

    this._route.post(
        "/editPersonDetails",
        checkActiveSession,
        tokenVerified,
        this.editPersonDetails
    )
    
    this._route.post(
        "/getPersonSuggestion",
        checkActiveSession,
        tokenVerified,
        this.getPersonSuggestion
    ) 

    this._route.post(
        "/saveOtDetails",
        checkActiveSession,
        tokenVerified,
        this.saveOtDetails
    ) 

    this._route.post(
        "/editOtDetails",
        checkActiveSession,
        tokenVerified,
        this.updateOtDetails
    ) 

    this._route.get(
        "/getOtList",
        checkActiveSession,
        tokenVerified,
        this.getOtList
    ) 

    this._route.get(
      "/getInjectionList",
      checkActiveSession,
      tokenVerified,
      this.getInjectionList
    ) 

    this._route.post(
      "/saveInjectionDetails",
      checkActiveSession,
      tokenVerified,
      this.saveInjectionDetails
    ) 

    this._route.post(
      "/editInjectionDetails",
      checkActiveSession,
      tokenVerified,
      this.editInjectionDetails
    )
    
    this._route.get(
      "/getInjectionSuggestionList",
      checkActiveSession,
      tokenVerified,
      this.getInjectionSuggestion
    ) 
  }

  getAllPersonsList = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtModuleController(req, res, next);
    await controllerObj.getAllPersonsListHandler();
  });

  getAllPersonsListDesignationWise = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtModuleController(req, res, next);
    await controllerObj.getAllPersonsListDesignationWiseHandler();
  });

  savePersonList = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtModuleController(req, res, next);
    await controllerObj.savePersonListHandler();
  });

  editPersonDetails = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtModuleController(req, res, next);
    await controllerObj.editPersonDetailsHandler();
  });
  
  getPersonSuggestion = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtModuleController(req, res, next);
    await controllerObj.getPersonSuggestionHandler();
  });

  saveOtDetails = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtModuleController(req, res, next);
    await controllerObj.saveOtDetailsHandler();
  });

  getOtList = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtModuleController(req, res, next);
    await controllerObj.getOtListHandler();
  });

  updateOtDetails = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtModuleController(req, res, next);
    await controllerObj.updateOtDetailsHandler();
  });

  getInjectionList = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtModuleController(req, res, next);
    await controllerObj.getInjectionListHandler();
  });

  saveInjectionDetails = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtModuleController(req, res, next);
    await controllerObj.saveInjectionDetailsHandler();
  });

  editInjectionDetails = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtModuleController(req, res, next);
    await controllerObj.editInjectionDetailsHandler();
  });

  getInjectionSuggestion = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtModuleController(req, res, next);
    await controllerObj.getInjectionSuggestionController();
  });
}

module.exports = LabsRoute;
