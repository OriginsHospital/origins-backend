const Constants = require("../constants/constants");
const OtherPaymentsService = require("../services/otherPaymentsService");

class OtherPaymentsController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new OtherPaymentsService(
      this._request,
      this._response,
      this._next
    );
  }

  async addNewPaymentHandler() {
    const data = await this._service.addNewPaymentService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getOtherPaymentsStatusHandler() {
    const data = await this._service.getOtherPaymentsStatusService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getOrderIdHandler() {
    const data = await this._service.getOrderIdService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async sendTransactionIdHandler() {
    const data = await this._service.sendTransactionIdService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async downloadInvoiceController() {
    const data = await this._service.downloadInvoiceService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updatePaymentHistoryHandler() {
    const data = await this._service.updatePaymentHistoryService();
    this._response.status(200).send({
      status: 200,
      message: "Payment history entry updated successfully",
      data: data
    });
  }

  async deletePaymentHistoryHandler() {
    const data = await this._service.deletePaymentHistoryService();
    this._response.status(200).send({
      status: 200,
      message: data.message || "Payment history entry deleted successfully",
      data: data
    });
  }
}

module.exports = OtherPaymentsController;
