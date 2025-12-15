const express = require("express");
const PharmacyController = require("../controllers/pharmacyController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class PharmacyRoute {
  _route = express.Router();

  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/master/getTaxCategory",
      checkActiveSession,
      tokenVerified,
      this.getTaxCategory
    );
    this._route.post(
      "/master/createTaxCategory",
      checkActiveSession,
      tokenVerified,
      this.createTaxCategory
    );
    this._route.post(
      "/master/editTaxCategory",
      checkActiveSession,
      tokenVerified,
      this.editTaxCategory
    );

    this._route.get(
      "/master/getInventoryType",
      checkActiveSession,
      tokenVerified,
      this.getInventoryType
    );
    this._route.post(
      "/master/createInventoryType",
      checkActiveSession,
      tokenVerified,
      this.createInventoryType
    );
    this._route.post(
      "/master/editInventoryType",
      checkActiveSession,
      tokenVerified,
      this.editInventoryType
    );

    this._route.get(
      "/master/getSupplier",
      checkActiveSession,
      tokenVerified,
      this.getSupplier
    );
    this._route.post(
      "/master/createSupplier",
      checkActiveSession,
      tokenVerified,
      this.createSupplier
    );
    this._route.post(
      "/master/editSupplier",
      checkActiveSession,
      tokenVerified,
      this.editSupplier
    );

    this._route.get(
      "/master/getManufacturer",
      checkActiveSession,
      tokenVerified,
      this.getManufacturer
    );
    this._route.post(
      "/master/createManufacturer",
      checkActiveSession,
      tokenVerified,
      this.createManufacturer
    );
    this._route.post(
      "/master/editManufacturer",
      checkActiveSession,
      tokenVerified,
      this.editManufacturer
    );

    this._route.get(
      "/getPharmacyDetailsByDate",
      checkActiveSession,
      tokenVerified,
      this.getPharmacyByDate
    );
    this._route.put(
      "/updatePharmacyDetails",
      checkActiveSession,
      tokenVerified,
      this.updatePharmacyDetails
    );
    this._route.post(
      "/generatePaymentBreakUp",
      checkActiveSession,
      tokenVerified,
      this.generatePaymentBreakUp
    );

    this._route.get(
      "/getGrnList",
      checkActiveSession,
      tokenVerified,
      this.getGrnList
    );
    this._route.post(
      "/saveGrnDetails",
      checkActiveSession,
      tokenVerified,
      this.saveGrnDetailsHandler
    );
    this._route.get(
      "/getGrnDetails/:id",
      checkActiveSession,
      tokenVerified,
      this.getGrnDetailsByIdHandler
    );
    this._route.post(
      "/saveGrnPayments",
      checkActiveSession,
      tokenVerified,
      this.saveGrnPaymentsHandler
    );

    this._route.get(
      "/getItemSuggestion/:searchText",
      checkActiveSession,
      tokenVerified,
      this.getItemSuggestion
    );
    this._route.get(
      "/getSupplierSuggestion/:searchText",
      checkActiveSession,
      tokenVerified,
      this.getSupplierSuggestion
    );

    this._route.get(
      "/getGrnItemsReturnHistory",
      checkActiveSession,
      tokenVerified,
      this.getGrnItemsReturnsHistory
    );
    this._route.post(
      "/returnGrnItems",
      checkActiveSession,
      tokenVerified,
      this.returnGrnItemsHandler
    );

    this._route.get(
      "/showAvailableGrnInfoByItemId",
      checkActiveSession,
      tokenVerified,
      this.showGrnAvailabilityByItemIdHandler
    );
  }

  getTaxCategory = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.getTaxCategoryHandler();
  });

  createTaxCategory = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.createTaxCategoryHandler();
  });

  editTaxCategory = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.editTaxCategoryHandler();
  });

  getInventoryType = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.getInventoryTypeHandler();
  });

  createInventoryType = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.createInventoryTypeHandler();
  });

  editInventoryType = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.editInventoryTypeHandler();
  });

  getSupplier = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.getSupplierHandler();
  });

  createSupplier = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.createSupplierHandler();
  });

  editSupplier = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.editSupplierHandler();
  });

  getManufacturer = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.getManufacturerHandler();
  });

  createManufacturer = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.createManufacturerHandler();
  });

  editManufacturer = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.editManufacturerHandler();
  });

  getPharmacyByDate = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.getPharmacyByDateHandler();
  });

  updatePharmacyDetails = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.updatePharmacyDetailsHandler();
  });

  saveGrnDetailsHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.saveGrnDetailsHandler();
  });

  getGrnDetailsByIdHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.getGrnDetailsByIdHandler();
  });

  saveGrnPaymentsHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.saveGrnPaymentsHandler();
  });

  getItemSuggestion = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.getItemSuggestionHandler();
  });

  getSupplierSuggestion = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.getSupplierSuggestionHandler();
  });

  getGrnList = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.getGrnListHandler();
  });

  generatePaymentBreakUp = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.generatePaymentBreakUpHandler();
  });

  getGrnItemsReturnsHistory = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.grnItemsReturnHistoryHandler();
  });

  returnGrnItemsHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.returnGrnItemsHandler();
  });

  showGrnAvailabilityByItemIdHandler = asyncHandler(async (req, res, next) => {
    const controllerObj = new PharmacyController(req, res, next);
    await controllerObj.showGrnAvailabilityByItemIdController();
  });
}

module.exports = PharmacyRoute;
