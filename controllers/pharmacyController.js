const PharmacyService = require("../services/pharmacyService.js");
const Constants = require("../constants/constants");

class PharmacyController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new PharmacyService(
      this._request,
      this._response,
      this._next
    );
  }

  async getTaxCategoryHandler() {
    const data = await this._service.getTaxCategoryService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createTaxCategoryHandler() {
    const data = await this._service.createTaxCategoryService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editTaxCategoryHandler() {
    const data = await this._service.editTaxCategoryService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getInventoryTypeHandler() {
    const data = await this._service.getInventoryTypeService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createInventoryTypeHandler() {
    const data = await this._service.createInventoryTypeService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editInventoryTypeHandler() {
    const data = await this._service.editInventoryTypeService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getSupplierHandler() {
    const data = await this._service.getSupplierService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createSupplierHandler() {
    const data = await this._service.createSupplierService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editSupplierHandler() {
    const data = await this._service.editSupplierService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getManufacturerHandler() {
    const data = await this._service.getManufacturerService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createManufacturerHandler() {
    const data = await this._service.createManufacturerService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editManufacturerHandler() {
    const data = await this._service.editManufacturerService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPharmacyByDateHandler() {
    const data = await this._service.getPharmacyByDateService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updatePharmacyDetailsHandler() {
    const data = await this._service.updatePharmacyDetailsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveGrnDetailsHandler() {
    const data = await this._service.saveGrnDetailsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getGrnDetailsByIdHandler() {
    const data = await this._service.getGrnDetailsByIdService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getItemSuggestionHandler() {
    const data = await this._service.getItemSuggestionService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getSupplierSuggestionHandler() {
    const data = await this._service.getSupplierSuggestionService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getGrnListHandler() {
    const data = await this._service.getGrnListService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async generatePaymentBreakUpHandler() {
    const data = await this._service.generatePaymentBreakUpService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async grnItemsReturnHistoryHandler() {
    const data = await this._service.grnItemsReturnHistoryService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async returnGrnItemsHandler() {
    const data = await this._service.returnGrnItemsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveGrnPaymentsHandler() {
    const data = await this._service.saveGrnPaymentsService();

    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async showGrnAvailabilityByItemIdController() {
    const data = await this._service.showGrnAvailabilityByItemIdService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = PharmacyController;
