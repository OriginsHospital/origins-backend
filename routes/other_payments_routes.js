const express = require("express");
const OtherPaymentsController = require("../controllers/otherPaymentsController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  tokenVerified,
  checkActiveSession
} = require("../middlewares/authMiddlewares");

class OtherPaymentModuleRoutes {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/getOtherPaymentsStatus/:patientId",
      checkActiveSession,
      tokenVerified,
      this.getOtherPaymentsStatusRoute
    );

    this._route.post(
      "/addNewPayment",
      checkActiveSession,
      tokenVerified,
      this.addNewPaymentRoute
    );

    this._route.post(
      "/getOrderId",
      checkActiveSession,
      tokenVerified,
      this.getOrderIdRoute
    );

    this._route.post(
      "/sendTransactionId",
      checkActiveSession,
      tokenVerified,
      this.sendTransactionIdRoute
    );

    this._route.get(
      "/downloadInvoice",
      checkActiveSession,
      tokenVerified,
      this.downloadInvoiceRoute
    );

    // Update payment history entry
    this._route.put(
      "/updatePaymentHistory/:paymentHistoryId",
      checkActiveSession,
      tokenVerified,
      this.updatePaymentHistoryRoute
    );

    // Delete payment history entry
    this._route.delete(
      "/deletePaymentHistory/:paymentHistoryId",
      checkActiveSession,
      tokenVerified,
      this.deletePaymentHistoryRoute
    );
  }

  addNewPaymentRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtherPaymentsController(req, res, next);
    await controllerObj.addNewPaymentHandler();
  });

  getOtherPaymentsStatusRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtherPaymentsController(req, res, next);
    await controllerObj.getOtherPaymentsStatusHandler();
  });

  getOrderIdRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtherPaymentsController(req, res, next);
    await controllerObj.getOrderIdHandler();
  });

  sendTransactionIdRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtherPaymentsController(req, res, next);
    await controllerObj.sendTransactionIdHandler();
  });

  downloadInvoiceRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtherPaymentsController(req, res, next);
    await controllerObj.downloadInvoiceController();
  });

  updatePaymentHistoryRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtherPaymentsController(req, res, next);
    await controllerObj.updatePaymentHistoryHandler();
  });

  deletePaymentHistoryRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new OtherPaymentsController(req, res, next);
    await controllerObj.deletePaymentHistoryHandler();
  });
}

module.exports = OtherPaymentModuleRoutes;
