const express = require("express");
const RolesController = require("../controllers/rolesController");
const { asyncHandler } = require("../middlewares/errorHandlers");

class ManageRolesRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get("/getRoles", this.getRolesRoute);
    this._route.get("/getRoleDetails/:id", this.getRoleDetailsRoute);
    this._route.post("/addRole", this.addRoleRoute);
    this._route.put("/editRole", this.editRoleRoute);
    this._route.delete("/deleteRole", this.deleteRoleRoute);
  }

  getRolesRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new RolesController(req, res, next);
    await controllerObj.getRolesHandler();
  });

  getRoleDetailsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new RolesController(req, res, next);
    await controllerObj.getRoleDetailsHandler();
  });

  addRoleRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new RolesController(req, res, next);
    await controllerObj.addRoleHandler();
  });

  editRoleRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new RolesController(req, res, next);
    await controllerObj.editRoleHandler();
  });

  deleteRoleRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new RolesController(req, res, next);
    await controllerObj.deleteRoleHandler();
  });
}

module.exports = ManageRolesRoute;
