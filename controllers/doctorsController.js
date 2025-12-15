const DoctorsService = require("../services/doctorsService.js");
const Constants = require("../constants/constants");

class DoctorsController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new DoctorsService(
      this._request,
      this._response,
      this._next
    );
  }

  async createdoctorHandler() {
    const data = await this._service.createDoctorAvailabiltyService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAvailabilityDoctorHandler() {
    const data = await this._service.getAvailabilityDoctorService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createLineBillsAndNotesForAppointmentHandler() {
    const data = await this._service.createLineBillsAndNotesForAppointmentService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getLineBillsAndNotesForAppointmentHandler() {
    const data = await this._service.getLineBillsAndNotesForAppointmentService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAppointsmentsByDateHandler() {
    const data = await this._service.getAppointmentsByDateService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAppointmentsByPatientHandler() {
    const data = await this._service.getAppointmentsByPatientService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPatientHistoryHandler() {
    const data = await this._service.getPatientHistoryService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAppointmentHistoryHandler() {
    const data = await this._service.getAppointmentHistoryService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getShiftRequestHistoryHandler() {
    const data = await this._service.getShiftRequestHistoryService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async shiftChangeRequestHandler() {
    const data = await this._service.shiftChangeRequestService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getCheckListSheetByPatientIdHandler() {
    const data = await this._service.getCheckListSheetByPatientIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPatientEmbryologyHistory() {
    const data = await this._service.getPatientEmbryologyHistory(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async setIsCompletedForAppointmentHandler() {
    const data = await this._service.setIsCompletedForAppointmentService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = DoctorsController;
