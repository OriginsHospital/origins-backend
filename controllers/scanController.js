const ScanService = require("../services/scanService");
const Constants = require("../constants/constants");

class ScanController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new ScanService(this._request, this._response, this._next);
  }

  async getScansByDateHandler() {
    const data = await this._service.getScansByDateService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPrescriptionsByDateHandler() {
    const data = await this._service.getPrescriptionsByDateService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getOpuSheetsByDateHandler() {
    const data = await this._service.getOpuSheetsByDateService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getHysteroLapByDateHandler() {
    const data = await this._service.getHysteroLapByDateService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getScanReportsHandler() {
    const data = await this._service.getScanReportsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getScanTemplateByIdHandler() {
    const data = await this._service.getScanTemplateByIdService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveScanResultHandler() {
    const data = await this._service.saveScanResultService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getSavedScanResult() {
    const data = await this._service.getSavedScanResultService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async uploadFormFForScansHandler() {
    const data = await this._service.uploadFormFForScansService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteFormFForScansHandler() {
    const data = await this._service.deleteFormFForScansService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async downloadFormFSampleTemplateHandler() {
    await this._service.downloadFormFSampleTemplateService(this._request);
  }

  async reviewFormFTemplateController() {
    const data = await this._service.reviewFormFTemplateService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getFormTemplateByDateRangeController() {
    const data = await this._service.getFormTemplateByDateRangeService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async downloadScanReportHandler() {
    await this._service.downloadScanReportService(this._request);
  }

  async getUptResultsHandler() {
    const data = await this._service.getUptResultsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveUptResultHandler() {
    const data = await this._service.saveUptResultService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editUptResultHandler() {
    const data = await this._service.editUptResultService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteUptResultHandler() {
    const data = await this._service.deleteUptResultService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getDischargeCardsByDateHandler() {
    const data = await this._service.getDischargeCardsByDateService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getDischargeCardHandler() {
    const data = await this._service.getDischargeCardService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveDischargeCardHandler() {
    const data = await this._service.saveDischargeCardService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = ScanController;
