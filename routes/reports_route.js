const express = require("express");
const ReportsController = require("../controllers/reportsController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class ReportsRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/appointmentStageDurationReport",
      checkActiveSession,
      tokenVerified,
      this.getStageDurationReportRoute
    );
    this._route.get(
      "/getGrnVendorPaymentsReport",
      checkActiveSession,
      tokenVerified,
      this.getGrnVendorPaymentReportHandler
    );
    this._route.get(
      "/prescribedPurchaseReport",
      checkActiveSession,
      tokenVerified,
      this.getPurchasePrescribedReportHandler
    );
    this._route.get(
      "/stockExpiryReport",
      checkActiveSession,
      tokenVerified,
      this.getStockExpiryReport
    );
    this._route.get(
      "/salesReport",
      checkActiveSession,
      tokenVerified,
      this.getSalesReport
    );
    this._route.get(
      "/patientPharmacySalesReport",
      checkActiveSession,
      tokenVerified,
      this.getPatientPharmacySalesReport
    );
    this._route.get(
      "/pharmacySalesDetailedReport",
      checkActiveSession,
      tokenVerified,
      this.getPharmacySalesDetailedReport
    );
    this._route.get(
      "/grnSalesReport",
      checkActiveSession,
      tokenVerified,
      this.getGrnSalesReport
    );
    this._route.get(
      "/stockReport",
      checkActiveSession,
      tokenVerified,
      this.getStockReport
    );
    this._route.get(
      "/grnStockReportTab",
      checkActiveSession,
      tokenVerified,
      this.getGrnStockReportTab
    );
    this._route.get(
      "/itemPurchaseHistoryReport/:itemId",
      checkActiveSession,
      tokenVerified,
      this.itemPurchaseHistoryReport
    );

    this._route.get(
      "/noShowReport",
      checkActiveSession,
      tokenVerified,
      this.noShowReport
    );

    this._route.get(
      "/treatmentCyclesReport",
      checkActiveSession,
      tokenVerified,
      this.treatmentCyclesReport
    );

    this._route.get(
      "/treatmentCyclesPaymentsReport",
      checkActiveSession,
      tokenVerified,
      this.treatmentCyclesPaymentsReport
    );

    this._route.get(
      "/vendorManufacturerDepartmentReport",
      checkActiveSession,
      tokenVerified,
      this.vendorManufacturerDepartmentReport
    );

    this._route.put(
      "/revenueNew/entry/:source/:paymentMasterId",
      checkActiveSession,
      tokenVerified,
      this.updateRevenueNewEntry
    );

    this._route.delete(
      "/revenueNew/entry/:source/:paymentMasterId",
      checkActiveSession,
      tokenVerified,
      this.deleteRevenueNewEntry
    );
  }

  getStageDurationReportRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.getStageDurationReportHandler();
  });

  getGrnVendorPaymentReportHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.getGrnVendorPaymentsHandler();
  });

  getPurchasePrescribedReportHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.getPurchasePrescribedHandler();
  });

  getStockExpiryReport = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.getStockExpiryReportHandler();
  });

  getSalesReport = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.getSalesReportHandler();
  });

  getPatientPharmacySalesReport = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.getPatientPharmacySalesReportHandler();
  });

  getPharmacySalesDetailedReport = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.getPharmacySalesDetailedReportHandler();
  });

  getGrnSalesReport = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.getGrnSalesReportHandler();
  });

  getStockReport = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.getStockReportHandler();
  });

  getGrnStockReportTab = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.getGrnStockReportTabHandler();
  });

  itemPurchaseHistoryReport =  asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.getItemPurchaseHistoryReport();
  });

  noShowReport =  asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.noShowReportHandler();
  });

  treatmentCyclesPaymentsReport = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.treatmentCyclesPaymentsReportHandler();
  })

  treatmentCyclesReport = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.treatmentCyclesReportHandler();
  })

  vendorManufacturerDepartmentReport = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.vendorManufacturerDepartmentReportHandler();
  });

  updateRevenueNewEntry = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.updateRevenueNewEntryHandler();
  });

  deleteRevenueNewEntry = asyncHandler(async (req, res, next) => {
    const controllerObj = new ReportsController(req, res, next);
    await controllerObj.deleteRevenueNewEntryHandler();
  });
}

module.exports = ReportsRoute;
