const express = require("express");
const TicketsController = require("../controllers/ticketsController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class TicketsRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    // Get all tickets with filters and pagination
    this._route.get(
      "/",
      checkActiveSession,
      tokenVerified,
      this.getTicketsRoute
    );

    // Get ticket details by ID
    this._route.get(
      "/:ticketId",
      checkActiveSession,
      tokenVerified,
      this.getTicketDetailsRoute
    );

    // Create new ticket
    this._route.post(
      "/",
      checkActiveSession,
      tokenVerified,
      this.createTicketRoute
    );

    // Update ticket
    this._route.put(
      "/",
      checkActiveSession,
      tokenVerified,
      this.updateTicketRoute
    );

    // Update ticket status
    this._route.patch(
      "/:ticketId/status",
      checkActiveSession,
      tokenVerified,
      this.updateTicketStatusRoute
    );

    // Delete ticket
    this._route.delete(
      "/:ticketId",
      checkActiveSession,
      tokenVerified,
      this.deleteTicketRoute
    );

    // Create ticket comment
    this._route.post(
      "/:ticketId/comments",
      checkActiveSession,
      tokenVerified,
      this.createTicketCommentRoute
    );

    // Get active staff for assignment dropdown
    this._route.get(
      "/staff/active",
      checkActiveSession,
      tokenVerified,
      this.getActiveStaffRoute
    );
  }

  getTicketsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TicketsController(req, res, next);
    await controllerObj.getTicketsRouteHandler();
  });

  getTicketDetailsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TicketsController(req, res, next);
    await controllerObj.getTicketDetailsRouteHandler();
  });

  createTicketRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TicketsController(req, res, next);
    await controllerObj.createTicketRouteHandler();
  });

  updateTicketRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TicketsController(req, res, next);
    await controllerObj.updateTicketRouteHandler();
  });

  updateTicketStatusRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TicketsController(req, res, next);
    await controllerObj.updateTicketStatusRouteHandler();
  });

  deleteTicketRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TicketsController(req, res, next);
    await controllerObj.deleteTicketRouteHandler();
  });

  createTicketCommentRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TicketsController(req, res, next);
    await controllerObj.createTicketCommentRouteHandler();
  });

  getActiveStaffRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TicketsController(req, res, next);
    await controllerObj.getActiveStaffRouteHandler();
  });
}

module.exports = TicketsRoute;

