const Constants = require("../constants/constants");
const UptResultsService = require("../services/uptResultsService");

class UptResultsController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new UptResultsService(
      this._request,
      this._response,
      this._next
    );
  }

  async getUptResultsHandler() {
    const data = await this._service.getUptResultsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async saveUptResultHandler() {
    const data = await this._service.saveUptResultService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async editUptResultHandler() {
    const data = await this._service.editUptResultService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }
}

module.exports = UptResultsController;
