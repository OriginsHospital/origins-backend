const ConsultantRoasterService = require("../services/consultantRoasterService");
const Constants = require("../constants/constants");

class ConsultantRoasterController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new ConsultantRoasterService(
      this._request,
      this._response,
      this._next
    );
  }

  async getAllConsultantRoastersHandler() {
    const data = await this._service.getAllConsultantRoastersService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createConsultantRoasterHandler() {
    const data = await this._service.createConsultantRoasterService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editConsultantRoasterHandler() {
    const data = await this._service.editConsultantRoasterService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = ConsultantRoasterController;
