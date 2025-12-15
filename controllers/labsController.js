const LabsService = require("../services/labsService");
const Constants = require("../constants/constants");

class LabsController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new LabsService(this._request, this._response, this._next);
  }

  async getLabtestsByDateHandler() {
    const data = await this._service.getLabtestsByDateService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAllLabTestsHandler() {
    const data = await this._service.getAllLabTestsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAllOutsourcingLabTestsHandler() {
    const data = await this._service.getAllOutsourcingLabTestsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getLabTestTemplateByIdHandler() {
    const data = await this._service.getLabTestTemplateByIdService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveLabTestResultHandler() {
    const data = await this._service.saveLabTestResultService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveOutsourcingLabTestResultHandler() {
    const data = await this._service.saveOutsourcingLabTestResultService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getSavedLabTestResultHandler() {
    const data = await this._service.getSavedLabtestResultService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteLabOursourcingTestResultHandler() {
    const data = await this._service.deleteLabOursourcingTestResultService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async downloadLabReportHandler() {
    await this._service.downloadLabReportService(this._request);
  }
}

module.exports = LabsController;
