const PaymentService = require("../services/PaymentService");
const Constants = require("../constants/constants");

class PaymentController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new PaymentService(
      this._request,
      this._response,
      this._service
    );
  }

  async getOrderIdHandler() {
    const data = await this._service.getOrderIdHandlerservice(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async sendTransactionIdHandler() {
    const data = await this._service.sendTransactionIdservice(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async generateInvoiceHandler() {
    const data = await this._service.generateInvoiceService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getSaleReturnInformationHandler() {
    const data = await this._service.getSaleReturnInformationService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async returnPharmacyItemsHandler() {
    const data = await this._service.returnPharmacyItemService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPurchaseReturnInformationHandler() {
    const data = await this._service.getSaleReturnInformationServiceLabScanAndEmbryology(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async returnPurchasedItemsHandler() {
    const data = await this._service.returnItemServiceOtherThanPharmacy(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = PaymentController;
