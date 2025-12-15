const FetService = require("../services/fetService");
const Constants = require("../constants/constants");

class FetController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new FetService(this._request, this._response, this._next);
  }

  async getFetConsentsByVisitIdHandler() {
    const data = await this._service.getFetConsentsByVisitIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async uploadFetConsentHandler() {
    const data = await this._service.uploadFetConsentsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteFetConsentByVisitIdHandler() {
    const data = await this._service.deleteFetConsentByVisitIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async reviewFetConsentsHandler() {
    const data = await this._service.reviewFetConsentsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

}

module.exports = FetController;
