const express = require("express");
const PaymentController = require("../controllers/PaymentController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class PaymentRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.post(
      "/getOrderId",
      checkActiveSession,
      tokenVerified,
      this.getOrderId
    );
    this._route.post(
      "/sendTransactionId",
      checkActiveSession,
      tokenVerified,
      this.sendTransactionId
    );

    this._route.post(
      "/generateInvoice",
      checkActiveSession,
      tokenVerified,
      this.generateInvoice
    );
    this._route.get(
      "/getSaleReturnInformation/:orderId",
      checkActiveSession,
      tokenVerified,
      this.getSaleReturnInformation
    );
    this._route.post(
      "/returnPharmacyItems",
      checkActiveSession,
      tokenVerified,
      this.returnPharmacyItems
    );

    this._route.get(
      "/getPurchaseReturnInformation/:orderId",
      checkActiveSession,
      tokenVerified,
      this.getPurchaseReturnInformation
    );
    this._route.post(
      "/returnPurchasedItems",
      checkActiveSession,
      tokenVerified,
      this.returnPurchasedItems
    );
  }

  getOrderId = asyncHandler(async (req, res, next) => {
    const controllerObj = new PaymentController(req, res, next);
    await controllerObj.getOrderIdHandler();
  });

  sendTransactionId = asyncHandler(async (req, res, next) => {
    const controllerObj = new PaymentController(req, res, next);
    await controllerObj.sendTransactionIdHandler();
  });

  generateInvoice = asyncHandler(async (req, res, next) => {
    const controllerObj = new PaymentController(req, res, next);
    await controllerObj.generateInvoiceHandler();
  });

  getSaleReturnInformation = asyncHandler(async (req, res, next) => {
    const controllerObj = new PaymentController(req, res, next);
    await controllerObj.getSaleReturnInformationHandler();
  });

  returnPharmacyItems = asyncHandler(async (req, res, next) => {
    const controllerObj = new PaymentController(req, res, next);
    await controllerObj.returnPharmacyItemsHandler();
  });

  getPurchaseReturnInformation =  asyncHandler(async (req, res, next) => {
    const controllerObj = new PaymentController(req, res, next);
    await controllerObj.getPurchaseReturnInformationHandler();
  });

  returnPurchasedItems = asyncHandler(async (req, res, next) => {
    const controllerObj = new PaymentController(req, res, next);
    await controllerObj.returnPurchasedItemsHandler();
  });
}

module.exports = PaymentRoute;
