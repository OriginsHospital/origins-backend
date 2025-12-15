const express = require("express");
const AuthController = require("../controllers/authController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  sessionExists,
  otpExists,
  resetLinkExists,
  sessionDoesNotExists,
  tokenVerified,
  checkActiveSession
} = require("../middlewares/authMiddlewares");

class AuthRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.post("/loginWithEmail", sessionExists, this.loginEmailRoute);
    this._route.post("/sendOtp", otpExists, this.sendOtpRoute);
    this._route.post("/verifyOtp", this.verifyOtpRoute);
    this._route.post(
      "/forgotPassword",
      resetLinkExists,
      this.forgotPasswordRoute
    );
    this._route.get("/resetPassword/:secretkey", this.resetPasswordGetRoute);
    this._route.post("/resetPassword", this.resetPasswordPostRoute);
    this._route.get("/loginDetected/:secretKey", this.loginDetectedGetRoute);
    this._route.get(
      "/getUserInfo",
      checkActiveSession,
      tokenVerified,
      this.getUserInfoRoute
    );
    this._route.post(
      "/blockUser",
      checkActiveSession,
      tokenVerified,
      this.rejectUserRoute
    );
    this._route.delete(
      "/deleteUser/:id",
      checkActiveSession,
      tokenVerified,
      this.deleteUserRoute
    );
    this._route.delete("/logout", sessionDoesNotExists, this.logoutRoute);
    this._route.post("/changePassword", this.changePasswordRoute);
    this._route.get(
      "/getNewAccessToken",
      checkActiveSession,
      this.getNewAccessTokenRoute
    );
  }

  loginEmailRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new AuthController(req, res, next);
    await controllerObj.loginEmailHandler();
  });

  verifyOtpRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new AuthController(req, res, next);
    await controllerObj.verifyOtpHandler();
  });

  sendOtpRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new AuthController(req, res, next);
    await controllerObj.sendOtpHandler();
  });

  forgotPasswordRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new AuthController(req, res, next);
    await controllerObj.forgotPasswordHandler();
  });

  resetPasswordGetRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new AuthController(req, res, next);
    await controllerObj.resetPasswordGetHandler();
  });

  resetPasswordPostRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new AuthController(req, res, next);
    await controllerObj.resetPasswordPostHandler();
  });

  loginDetectedGetRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new AuthController(req, res, next);
    await controllerObj.loginDetectedGetHandler();
  });

  getUserInfoRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new AuthController(req, res, next);
    await controllerObj.getUserInfoHandler();
  });

  rejectUserRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new AuthController(req, res, next);
    await controllerObj.rejectUserHandler();
  });

  deleteUserRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new AuthController(req, res, next);
    await controllerObj.deleteUserHandler();
  });

  logoutRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new AuthController(req, res, next);
    await controllerObj.logoutHandler();
  });

  getNewAccessTokenRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new AuthController(req, res, next);
    await controllerObj.getNewAccessTokenHandler();
  });

  changePasswordRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new AuthController(req, res, next);
    await controllerObj.changePasswordHandler();
  });
}
module.exports = AuthRoute;
