const express = require("express");
const ModulesController = require("../controllers/modulesController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  tokenVerified,
  checkActiveSession
} = require("../middlewares/authMiddlewares");

class ManageModulesRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/getModules",
      checkActiveSession,
      tokenVerified,
      this.getModulesRoute
    );
    this._route.get(
      "/getModuleDetails/:id",
      checkActiveSession,
      tokenVerified,
      this.getModuleDetailsRoute
    );
    this._route.post(
      "/addModule",
      checkActiveSession,
      tokenVerified,
      this.addModuleRoute
    );
    this._route.put(
      "/editModule",
      checkActiveSession,
      tokenVerified,
      this.editModuleRoute
    );
  }

  getModulesRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new ModulesController(req, res, next);
    await controllerObj.getModulesHandler();
  });

  getModuleDetailsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new ModulesController(req, res, next);
    await controllerObj.getModuleDetailsHandler();
  });

  editModuleRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new ModulesController(req, res, next);
    await controllerObj.editModuleHandler();
  });

  addModuleRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new ManageModulesRoute(req, res, next);
    await controllerObj.addModuleRoute();
  });
}

module.exports = ManageModulesRoute;
