const express = require("express");
const NotificationsController = require("../controllers/notificationsController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class NotificationsRoute {
  _route = express.Router();

  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    // Get all notifications with pagination
    this._route.get(
      "/",
      checkActiveSession,
      tokenVerified,
      this.getNotificationsRoute
    );

    // Get unread notifications count
    this._route.get(
      "/unread/count",
      checkActiveSession,
      tokenVerified,
      this.getUnreadNotificationsCountRoute
    );

    // Mark notification as read
    this._route.put(
      "/:notificationId/read",
      checkActiveSession,
      tokenVerified,
      this.markNotificationAsReadRoute
    );

    // Mark all notifications as read
    this._route.put(
      "/read/all",
      checkActiveSession,
      tokenVerified,
      this.markAllNotificationsAsReadRoute
    );
  }

  getNotificationsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new NotificationsController(req, res, next);
    await controllerObj.getNotificationsRouteHandler();
  });

  getUnreadNotificationsCountRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new NotificationsController(req, res, next);
    await controllerObj.getUnreadNotificationsCountRouteHandler();
  });

  markNotificationAsReadRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new NotificationsController(req, res, next);
    await controllerObj.markNotificationAsReadRouteHandler();
  });

  markAllNotificationsAsReadRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new NotificationsController(req, res, next);
    await controllerObj.markAllNotificationsAsReadRouteHandler();
  });
}

module.exports = NotificationsRoute;

