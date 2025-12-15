const express = require("express");
const BaseController = require("../controllers/baseController.js");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const multer = require("multer");
const upload = multer();

class BaseRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {

    this._route.post(
    "/uploadToS3Bucket",
    checkActiveSession,
    tokenVerified,
    upload.fields([{ name: "fileToUpload", maxCount: 1 }]),
    this.uploadToS3BucketRoute
    );
  
  }

  uploadToS3BucketRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new BaseController(req, res, next);
    await controllerObj.uploadToS3BucketRouteHandler();
  });

}

module.exports = BaseRoute;
