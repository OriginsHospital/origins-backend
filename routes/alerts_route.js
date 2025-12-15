const express = require("express");
const AlertsController = require("../controllers/alertsController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
    checkActiveSession,
    tokenVerified
} = require("../middlewares/authMiddlewares.js");

class AlertsRoute {
    _route = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    async intializeRoutes() {

        this._route.get(
            "/getAllAlerts",
            checkActiveSession,
            tokenVerified,
            this.getAllAlertsRoute
        );

        this._route.post(
            "/createAlert",
            checkActiveSession,
            tokenVerified,
            this.createAlertRoute
        );

        this._route.put(
            "/editAlert",
            checkActiveSession,
            tokenVerified,
            this.editAlertRoute
        );

        this._route.delete(
            "/deleteAlert/:alertId",
            checkActiveSession,
            tokenVerified,
            this.deleteAlertRoute
        );

    }

    getAllAlertsRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new AlertsController(req, res, next);
        await controllerObj.getAllAlertsRouteHandler();
    });

    createAlertRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new AlertsController(req, res, next);
        await controllerObj.createAlertRouteHandler();
    });

    editAlertRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new AlertsController(req, res, next);
        await controllerObj.editAlertRouteHandler();
    });

    deleteAlertRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new AlertsController(req, res, next);
        await controllerObj.deleteAlertRouteHandler();
    });
}

module.exports = AlertsRoute;
