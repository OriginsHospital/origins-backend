const PatientHistoryService = require("../services/patientHistoryService");
const Constants = require("../constants/constants");

class PatientHistoryController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new PatientHistoryService(
      this._request,
      this._response,
      this._next
    );
  }

  async getPatientVisitHistoryController() {
    const data = await this._service.getPatientVisitHistoryService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPatientEmbryologyHistoryController() {
    const data = await this._service.getPatientEmbryologyHistoryService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPatientConsultationHistoryController() {
    const data = await this._service.getPatientConsultationHistoryService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPatientTreatmentHistoryController() {
    const data = await this._service.getPatientTreatmentHistoryService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getConsultationInformationByAppointmentIdController() {
    const data = await this._service.getConsultationInformationByAppointmentIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getTreatmentInformationByAppointmentIdController() {
    const data = await this._service.getTreatmentInformationByAppointmentIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getFormFTemplateByPatientIdController() {
    const data = await this._service.getFormFTemplateByPatientIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getFormFTemplatesByScanAppointmentHandler() {
    const data = await this._service.getFormFTemplatesByScanAppointmentService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPrescriptionDetailsByTreatmentCycleIdFollicularHandler() {
    const data = await this._service.getPrescriptionDetailsByTreatmentCycleIdFollicularService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPaymentHistoryByVisitIdHandler() {
    const data = await this._service.getPaymentHistoryByVisitIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getNotesHistoryByVisitIdHandler() {
    const data = await this._service.getNotesHistoryByVisitIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updatePaymentHistoryHandler() {
    const data = await this._service.updatePaymentHistoryService();
    this._response.status(200).send({
      status: 200,
      message: "Payment record updated successfully",
      data: data
    });
  }

  async deletePaymentHistoryHandler() {
    const data = await this._service.deletePaymentHistoryService();
    this._response.status(200).send({
      status: 200,
      message: data.message || "Payment record deleted successfully",
      data: data
    });
  }
}

module.exports = PatientHistoryController;
