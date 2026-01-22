const express = require("express");
const TasksController = require("../controllers/tasksController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class TasksRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    const controllerObj = new TasksController();

    // Get all tasks with filters and pagination
    this._route.get(
      "/",
      checkActiveSession,
      tokenVerified,
      this.getTasksRoute
    );

    // Get task details by ID
    this._route.get(
      "/:taskId",
      checkActiveSession,
      tokenVerified,
      this.getTaskDetailsRoute
    );

    // Create new task
    this._route.post(
      "/",
      checkActiveSession,
      tokenVerified,
      this.createTaskRoute
    );

    // Update task
    this._route.put(
      "/",
      checkActiveSession,
      tokenVerified,
      this.updateTaskRoute
    );

    // Update task status
    this._route.patch(
      "/:taskId/status",
      checkActiveSession,
      tokenVerified,
      this.updateTaskStatusRoute
    );

    // Delete task
    this._route.delete(
      "/:taskId",
      checkActiveSession,
      tokenVerified,
      this.deleteTaskRoute
    );
  }

  getTasksRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TasksController(req, res, next);
    await controllerObj.getTasksRouteHandler();
  });

  getTaskDetailsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TasksController(req, res, next);
    await controllerObj.getTaskDetailsRouteHandler();
  });

  createTaskRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TasksController(req, res, next);
    await controllerObj.createTaskRouteHandler();
  });

  updateTaskRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TasksController(req, res, next);
    await controllerObj.updateTaskRouteHandler();
  });

  updateTaskStatusRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TasksController(req, res, next);
    await controllerObj.updateTaskStatusRouteHandler();
  });

  deleteTaskRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TasksController(req, res, next);
    await controllerObj.deleteTaskRouteHandler();
  });

  get route() {
    return this._route;
  }
}

module.exports = TasksRoute;

