const express = require("express");
const OrderController = require("../controllers/orderController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const multer = require("multer");
const upload = multer();

class OrdersRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/getAllOrders",
      checkActiveSession,
      tokenVerified,
      this.getOrdersRoute
    );
    this._route.post(
      "/createOrder",
      checkActiveSession,
      tokenVerified,
      this.createOrderRoute
    );
    this._route.put(
        "/placeOrder",
        checkActiveSession,
        tokenVerified,
        this.placeOrderRoute
      );

    this._route.put(
    "/receiveOrder",
    checkActiveSession,
    tokenVerified,
    upload.fields([{ name: "orderInvoice", maxCount: 1 }]),
    this.receiveOrderRoute
    );

    this._route.put(
        "/paidOrder",
        checkActiveSession,
        tokenVerified,
        this.paidOrderRoute
      );

  
  }

  getOrdersRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new OrderController(req, res, next);
    await controllerObj.getAllOrdersHandler();
  });

  createOrderRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new OrderController(req, res, next);
    await controllerObj.createOrderHandler();
  });

  placeOrderRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new OrderController(req, res, next);
    await controllerObj.placeOrderHandler();
  });

  receiveOrderRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new OrderController(req, res, next);
    await controllerObj.receiveOrderHandler();
  });

  paidOrderRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new OrderController(req, res, next);
    await controllerObj.paidOrderHandler();
  });


}

module.exports = OrdersRoute;
