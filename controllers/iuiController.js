const IUIService = require("../services/IuiService.js");
const Constants = require("../constants/constants");

class IuiController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new IUIService(this._request, this._response, this._next);
  }

  async getIuiConsentsByVisitIdHandler() {
    const data = await this._service.getIuiConsentsByVisitIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async uploadIuiConsentHandler() {
    const data = await this._service.uploadIuiConsentService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteIuiConsentByVisitIdHandler() {
    const data = await this._service.deleteIuiConsentByVisitIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = IuiController;
