const express = require("express");
const InboxController = require("../controllers/inboxController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class InboxRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    // Get inbox items (alerts + comments)
    this._route.get(
      "/",
      checkActiveSession,
      tokenVerified,
      this.getInboxItemsRoute
    );
  }

  getInboxItemsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new InboxController(req, res, next);
    await controllerObj.getInboxItemsRouteHandler();
  });

  get route() {
    return this._route;
  }
}

module.exports = InboxRoute;

