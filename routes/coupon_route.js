const express = require("express");
const CouponController = require("../controllers/couponController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class ManageCouponRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/getAllCoupons",
      checkActiveSession,
      tokenVerified,
      this.getCouponsRoute
    );
    this._route.post(
      "/addCoupon",
      checkActiveSession,
      tokenVerified,
      this.addCouponRoute
    );
    this._route.post(
      "/editCoupon",
      checkActiveSession,
      tokenVerified,
      this.editCouponRoute
    );
    this._route.delete(
      "/deleteCoupon/:id",
      checkActiveSession,
      tokenVerified,
      this.deleteCoponRoute
    );
  }

  getCouponsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new CouponController(req, res, next);
    await controllerObj.getAllCouponHandler();
  });

  addCouponRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new CouponController(req, res, next);
    await controllerObj.createCouponHandler();
  });

  editCouponRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new CouponController(req, res, next);
    await controllerObj.editCouponHandler();
  });

  deleteCoponRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new CouponController(req, res, next);
    await controllerObj.deleteCouponHandler();
  });
}

module.exports = ManageCouponRoute;
