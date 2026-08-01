const Constants = require("../constants/constants");
const PatientTrackerService = require("../services/patientTrackerService");

class PatientTrackerController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new PatientTrackerService(
      this._request,
      this._response,
      this._next
    );
  }

  async getAllPatientTrackerHandler() {
    const data = await this._service.getAllPatientTrackerService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async getSummaryAutomatedHandler() {
    const data = await this._service.getSummaryAutomatedService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async getByPatientIdHandler() {
    const data = await this._service.getByPatientIdService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async createPatientTrackerHandler() {
    const data = await this._service.createPatientTrackerService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async editPatientTrackerHandler() {
    const data = await this._service.editPatientTrackerService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async upsertEmbryologyUptHandler() {
    const data = await this._service.upsertEmbryologyUptService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }
}

module.exports = PatientTrackerController;
