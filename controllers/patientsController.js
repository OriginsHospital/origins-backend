const PatientsService = require("../services/patientsService.js");
const Constants = require("../constants/constants");

class PatientsController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new PatientsService(
      this._request,
      this._response,
      this._next
    );
  }

  async searchPatientHandler() {
    const data = await this._service.searchPatientService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createPatientHandler() {
    const data = await this._service.createPatientService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createGuardianHandler() {
    const data = await this._service.createGuardianService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPatientsHandler() {
    const data = await this._service.getPatientsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getDateFilteredPatientsHandler() {
    const data = await this._service.getDateFilteredPatientsService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPatientDetailsHandler() {
    const data = await this._service.getPatientDetailsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editPatientHandler() {
    const data = await this._service.editPatientService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editGuardianHandler() {
    const data = await this._service.editGuardianService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deletePatientHandler() {
    const data = await this._service.deletePatientService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getFormFTemplateHandler() {
    const data = await this._service.getFormFTemplateService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getOpdSheetByPatientIdHandler() {
    const data = await this._service.getOpdSheetByPatientIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveOpdSheetHandler() {
    const data = await this._service.saveOpdSheetService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getDischargeSummarySheetByTreatmentIdHandler() {
    const data = await this._service.getDischargeSummarySheetByTreatmentIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveDischargeSummarySheetHandler() {
    const data = await this._service.saveDischargeSummarySheetService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPickUpSheetByTreatmentIdHandler() {
    const data = await this._service.getPickUpSheetByTreatmentIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async savePickUpSheetHandler() {
    const data = await this._service.savePickUpSheetService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPatientTreatmentCyclesHandler() {
    const data = await this._service.getPatientTreatmentCyclesService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async downloadOpdSheedByPatientIdHandler() {
    await this._service.downloadOpdSheedByPatientIdService(this._request);
  }
}
module.exports = PatientsController;
