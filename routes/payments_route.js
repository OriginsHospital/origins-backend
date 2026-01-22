const express = require("express");
const PaymentsController = require("../controllers/paymentsController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const multer = require("multer");
const upload = multer();

class PaymentsRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.post(
      "/create",
      checkActiveSession,
      tokenVerified,
      upload.fields([
        { name: "invoiceFile", maxCount: 1 },
        { name: "receiptFile", maxCount: 1 }
      ]),
      this.createPaymentRoute
    );

    this._route.get(
      "/getAll",
      checkActiveSession,
      tokenVerified,
      this.getAllPaymentsRoute
    );
  }

  createPaymentRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PaymentsController(req, res, next);
    await controllerObj.createPaymentHandler();
  });

  getAllPaymentsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PaymentsController(req, res, next);
    await controllerObj.getAllPaymentsHandler();
  });
}

module.exports = PaymentsRoute;

