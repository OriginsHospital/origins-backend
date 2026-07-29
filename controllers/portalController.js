const Constants = require("../constants/constants");
const PortalService = require("../services/portalService");

class PortalController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new PortalService(request, response, next);
  }

  async loginHandler() {
    const data = await this._service.loginService();
    this._response.status(200).send({
      status: 200,
      message: Constants.USER_LOGIN_SUCCESS,
      data
    });
  }

  async meHandler() {
    const data = await this._service.meService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async createStaffHandler() {
    const data = await this._service.createStaffService();
    this._response.status(200).send({
      status: 200,
      message: "Staff user created successfully",
      data
    });
  }

  async listStaffHandler() {
    const data = await this._service.listStaffService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async searchPatientsHandler() {
    const data = await this._service.searchPatientsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async createPatientLoginHandler() {
    const data = await this._service.createPatientLoginService();
    this._response.status(200).send({
      status: 200,
      message: "Patient portal login created successfully",
      data
    });
  }

  async listPatientLoginsHandler() {
    const data = await this._service.listPatientLoginsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async togglePatientLoginHandler() {
    const data = await this._service.togglePatientLoginService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async patientDashboardHandler() {
    const data = await this._service.patientDashboardService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async patientMedicinesHandler() {
    const data = await this._service.patientMedicinesService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async patientReportsHandler() {
    const data = await this._service.patientReportsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async patientTreatmentsHandler() {
    const data = await this._service.patientTreatmentsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async patientProfileHandler() {
    const data = await this._service.patientProfileService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }

  async mastersHandler() {
    const data = await this._service.getRolesAndBranchesService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data
    });
  }
}

module.exports = PortalController;
