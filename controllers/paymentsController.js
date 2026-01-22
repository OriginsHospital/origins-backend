const PaymentsService = require("../services/paymentsService");
const Constants = require("../constants/constants");

class PaymentsController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new PaymentsService(
      this._request,
      this._response,
      this._next
    );
  }

  async createPaymentHandler() {
    const data = await this._service.createPaymentService();
    this._response.status(201).json({
      status: 201,
      message: "Payment created successfully",
      data: data
    });
  }

  async getAllPaymentsHandler() {
    const data = await this._service.getAllPaymentsService();
    this._response.status(200).json({
      status: 200,
      message:
        Constants.DATA_FETCHED_SUCCESS || "Payments fetched successfully",
      data: data
    });
  }
}

module.exports = PaymentsController;
