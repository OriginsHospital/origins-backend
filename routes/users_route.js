const express = require("express");
const UsersController = require("../controllers/usersController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  tokenVerified,
  checkActiveSession
} = require("../middlewares/authMiddlewares");

class UsersRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/getUserDetails/:id",
      checkActiveSession,
      tokenVerified,
      this.getUserDetailsRoute
    );
    this._route.post(
      "/getUsersList",
      checkActiveSession,
      tokenVerified,
      this.getUsersListRoute
    );
    this._route.get(
      "/getBlockedUsersList",
      checkActiveSession,
      tokenVerified,
      this.getBlockedUsersListRoute
    );
    this._route.post(
      "/getUsersListWithPagination",
      checkActiveSession,
      tokenVerified,
      this.getUsersListWithPaginationRoute
    );
    this._route.put(
      "/updateUserDetails",
      checkActiveSession,
      tokenVerified,
      this.updateUserDetailsRoute
    );

    this._route.get(
      "/getUserProfileInfo",
      checkActiveSession,
      tokenVerified,
      this.getUserProfileInfoRoute
    );
    this._route.put(
      "/updateUserProfile",
      checkActiveSession,
      tokenVerified,
      this.updateUserProfileRoute
    );
    this._route.get(
      "/branchChangeRequestHistory",
      checkActiveSession,
      tokenVerified,
      this.getBranchRequestHistoryRoute
    );
    this._route.post(
      "/branchChangeRequest",
      checkActiveSession,
      tokenVerified,
      this.branchChangeRequestRoute
    );
    this._route.post(
      "/changePassword",
      checkActiveSession,
      tokenVerified,
      this.changePasswordRoute
    );
    this._route.get(
      "/getUserSuggestion",
      checkActiveSession,
      tokenVerified,
      this.getUserSuggestionRoute
    );
    this._route.get(
      "/getValidUsersList",
      checkActiveSession,
      tokenVerified,
      this.getValidUsResListRoute
    );
  }

  getUserDetailsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new UsersController(req, res, next);
    await controllerObj.getUserDetailsHandler();
  });

  getUsersListRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new UsersController(req, res, next);
    await controllerObj.getUsersListHandler();
  });

  getBlockedUsersListRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new UsersController(req, res, next);
    await controllerObj.getBlockedUsersListHandler();
  });

  getUsersListWithPaginationRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new UsersController(req, res, next);
    await controllerObj.getUsersListWithPaginationHandler();
  });

  updateUserDetailsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new UsersController(req, res, next);
    await controllerObj.updateUserDetailsHandler();
  });

  getUserProfileInfoRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new UsersController(req, res, next);
    await controllerObj.getUserProfileInfoHandler();
  });

  updateUserProfileRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new UsersController(req, res, next);
    await controllerObj.updateUserProfileHandler();
  });

  getBranchRequestHistoryRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new UsersController(req, res, next);
    await controllerObj.getBranchRequestHistoryHandler();
  });

  branchChangeRequestRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new UsersController(req, res, next);
    await controllerObj.branchChangeRequestHandler();
  });

  changePasswordRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new UsersController(req, res, next);
    await controllerObj.changePasswordHandler();
  });

  getUserSuggestionRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new UsersController(req, res, next);
    await controllerObj.getUserSuggestionHandler();
  });

  getValidUsResListRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new UsersController(req, res, next);
    await controllerObj.getValidUsersListHandler();
  });
}

module.exports = UsersRoute;
