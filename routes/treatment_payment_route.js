const express = require("express");
const TreatmentPaymentController = require("../controllers/treatmentPaymentController.js");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class TreatmentPaymentsRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.post("/getOrderId",  checkActiveSession, tokenVerified, this.getOrderId);
    this._route.post("/sendTransaction", checkActiveSession, tokenVerified, this.sendTransaction);
  }

  getOrderId = asyncHandler(async (req, res, next) => {
    const controllerObj = new TreatmentPaymentController(req, res, next);
    await controllerObj.getOrderIdHandler();
  });

  sendTransaction = asyncHandler(async (req, res, next) => {
    const controllerObj = new TreatmentPaymentController(req, res, next);
    await controllerObj.sendTransactionHandler();
  });

}

module.exports = TreatmentPaymentsRoute;
