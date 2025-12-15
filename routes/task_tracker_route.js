const express = require("express");
const TaskTrackerController = require("../controllers/taskTrackerController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const multer = require('multer');
const upload = multer(); 

class TaskTrackerRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {

    this._route.get(
    "/getAllTasks",
    checkActiveSession,
    tokenVerified,
    this.getAllTasksRoute
    );

    this._route.post(
        "/createTask",
        checkActiveSession,
        tokenVerified,
        this.createTaskRoute
    );

    this._route.post(
        "/createComment",
        checkActiveSession,
        tokenVerified,
        this.createTaskCommentRoute
    );

    this._route.get(
        "/getTaskDetails/:taskId",
        checkActiveSession,
        tokenVerified,
        this.getTaskDetailsRoute
    );

    this._route.put(
      "/editTask",
      checkActiveSession,
      tokenVerified,
      this.editTaskRoute
  );

    this._route.post(
      "/addReferenceImages/:taskId",
      checkActiveSession,
      tokenVerified,
      upload.fields([{ name: "referenceImages", maxCount: 10 }]),
      this.addReferenceImages
    );

    this._route.delete(
      "/deleteReferenceImage/:imageId",
      checkActiveSession,
      tokenVerified,
      this.deleteReferenceImage
    );
  
  }

  getAllTasksRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TaskTrackerController(req, res, next);
    await controllerObj.getAllTasksRouteHandler();
  });

  createTaskRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TaskTrackerController(req, res, next);
    await controllerObj.createTaskRouteHandler();
  });

  createTaskCommentRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TaskTrackerController(req, res, next);
    await controllerObj.createTaskCommentRouteHandler();
  });

  getTaskDetailsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TaskTrackerController(req, res, next);
    await controllerObj.getTaskDetailsRouteHandler();
  });

  editTaskRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TaskTrackerController(req, res, next);
    await controllerObj.editTaskRouteHandler();
  });

  addReferenceImages = asyncHandler(async (req, res, next) => {
    const controllerObj = new TaskTrackerController(req, res, next);
    await controllerObj.addReferenceImagesHandler();
  });

  deleteReferenceImage = asyncHandler(async (req, res, next) => {
    const controllerObj = new TaskTrackerController(req, res, next);
    await controllerObj.deleteReferenceImageHandler();
  });

}

module.exports = TaskTrackerRoute;
