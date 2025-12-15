const Constants = require("../constants/constants");
const AppointmentsPaymentService = require("../services/appointmentPaymentsService");

class AppointmentsPaymentController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new AppointmentsPaymentService(
      this._request,
      this._response,
      this._next
    );
  }

  async consultationGetAvailableDoctorsHandler() {
    const data = await this._service.consultationGetAvailableDoctorsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async consultationGetAvailableSlotsHandler() {
    const data = await this._service.consultationGetAvailableSlotsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async consultationBookAppointmentHandler() {
    const data = await this._service.consultationBookAppointmentService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAppointmentsByDateHandler() {
    const data = await this._service.getAppointmentsByDateService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAppointmentReasonsHandler() {
    const data = await this._service.getAppointmentReasonService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAppointmentReasonsByPatientTypeHandler() {
    const data = await this._service.getAppointmentReasonByPatientTypeService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getTreatmentSheetsHandler() {
    const data = await this._service.getTreatmentSheetsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getTreatmentSheetsByIdHandler() {
    const data = await this._service.getTreatmentSheetsByIdService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getTreatmentStatusHandler() {
    const data = await this._service.getTreatmentStatusService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async changeAppointmentStatusHandler() {
    const data = await this._service.changeAppointmentStatusService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAppointmentsByIdHandler() {
    const data = await this._service.getAppointmentsByIdService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async treatmentGetAvailableDoctorsHandler() {
    const data = await this._service.treatmentGetAvailableDoctorsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async treatmentGetAvailableSlotsHandler() {
    const data = await this._service.treatmentGetAvailableSlotsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async treatmentBookAppointmentHandler() {
    const data = await this._service.treatmentBookAppointmentService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateTreatmentStatusHandler() {
    const data = await this._service.updateTreatmentStatusService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateTreatmentSheetHandler() {
    const data = await this._service.updateTreatmentSheetService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async consultationBookReviewAppointmentHandler() {
    const data = await this._service.consultationBookReviewAppointmentService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async treatmentBookReviewAppointmentHandler() {
    const data = await this._service.treatmentBookReviewAppointmentService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getTreatmentFetSheetByIdHandler() {
    const data = await this._service.getTreatmentFetSheetsByIdService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateTreatmentFetSheetHandler() {
    const data = await this._service.updateTreatmentFetSheetHandler();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getTreatmentEraSheetByIdHandler() {
    const data = await this._service.getTreatmentEraSheetsByIdService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateTreatmentEraSheetHandler() {
    const data = await this._service.updateTreatmentEraSheetHandler();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteAppointmentHandler() {
    const data = await this._service.deleteAppointmentService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async applyNoShowHandler() {
    const data = await this._service.applyNoShowService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getHysteroscopySheetByVisitIdHandler() {
    const data = await this._service.getHysteroscopySheetByVisitIdService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateHysteroscopySheetByVisitIdHandler() {
    const data = await this._service.updateHysteroscopySheetByVisitIdService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async printPrescriptionHandler() {
    const data = await this._service.printPrescriptionService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async applyOptOutHandler() {
    const data = await this._service.applyOptOutService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPendingInformationHandler() {
    const data = await this._service.getPendingInformationService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async rescheduleAppointmentHandler() {
    const data = await this._service.rescheduleAppointmentService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createOtherAppointmentReasonHandler() {
    const data = await this._service.createOtherAppointmentReasonService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAllActiveVisitAppointmentsHandler() {
    const data = await this._service.getAllActiveVisitAppointmentsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = AppointmentsPaymentController;
