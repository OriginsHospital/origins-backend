const IcsiService = require("../services/IcsiService.js");
const Constants = require("../constants/constants");

class IcsiController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new IcsiService(this._request, this._response, this._next);
  }

  async getIcsiConsentsByVisitIdHandler() {
    const data = await this._service.getIcsiConsentsByVisitIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async uploadIcsiConsentHandler() {
    const data = await this._service.uploadIcsiConsentService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteIcsiConsentByVisitIdHandler() {
    const data = await this._service.deleteIcsiConsentByVisitIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async reviewIcsiConsentsHandler() {
    const data = await this._service.reviewIcsiConsentsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async startTriggerHandler() {
    const data = await this._service.startTriggerService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getEraConsentsByVisitIdHandler() {
    const data = await this._service.getEraConsentsByVisitIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async uploadEraConsentHandler() {
    const data = await this._service.uploadEraConsentsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteEraConsentByVisitIdHandler() {
    const data = await this._service.deleteEraConsentByVisitIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async reviewEraConsentsHandler() {
    const data = await this._service.reviewEraConsentsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = IcsiController;
