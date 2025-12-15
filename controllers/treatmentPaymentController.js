const TreatmentPaymentsService = require('../services/treatmentPaymentsService');
const Constants = require("../constants/constants");

class TreatmentPaymentController{
    constructor(request, response, next) {
        this._request = request;
        this._response = response;
        this._next = next;
        this._service = new TreatmentPaymentsService(
          this._request,
          this._response,
          this._next
        );
    }
    async getOrderIdHandler(){
      const data = await this._service.getOrderIdService(this._request);
      this._response.status(200).send({
        status: 200,
        message: Constants.SUCCESS,
        data: data
      });
    }

    async sendTransactionHandler(){
      const data = await this._service.sendTransactionService(this._request);
      this._response.status(200).send({
        status: 200,
        message: Constants.SUCCESS,
        data: data
      });
    }
}

module.exports = TreatmentPaymentController;