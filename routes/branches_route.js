const express = require("express");
const BranchesController = require("../controllers/branchesController");
const { asyncHandler } = require("../middlewares/errorHandlers");

class ManageBranchesRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get("/getBranches", this.getBranchesRoute);
  }

  getBranchesRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new BranchesController(req, res, next);
    await controllerObj.getBranchesHandler();
  });
}

module.exports = ManageBranchesRoute;
