const VisitsService = require("../services/visitsService.js");
const Constants = require("../constants/constants");

class visitsController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new VisitsService(
      this._request,
      this._response,
      this._next
    );
  }

  async createVisitHandler() {
    const data = await this._service.createVisitService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editVisitHandler() {
    const data = await this._service.editVisitService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getVisitHandler() {
    const data = await this._service.getVisitService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async closeVisitHandler() {
    const data = await this._service.closeVisitService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createConsultationOrTreatmentHandler() {
    const data = await this._service.createConsultationOrTreatmentService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getVisitInfoHandler() {
    const data = await this._service.getVisitInfoService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createPackageHandler() {
    const data = await this._service.createPackageService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editPackageHandler() {
    const data = await this._service.editPackageService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPackageHandler() {
    const data = await this._service.getPackageService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async applyDiscountForPackageHandler() {
    const data = await this._service.applyDiscountForPackageService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getDonarInformationHandler() {
    const data = await this._service.getDonarInformationService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getDonarDataByVisitIdHandler() {
    const data = await this._service.getDonarDataByVisitIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveDonarHandler() {
    const data = await this._service.saveDonarService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editDonarHandler() {
    const data = await this._service.editDonarService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteDonorFileHandler() {
    const data = await this._service.deleteDonorFileService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async closeVisitByConsultationHandler() {
    const data = await this._service.closeVisitByConsultationService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveHysteroscopyHandler() {
    const data = await this._service.saveHysteroscopyService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getHysteroscopyHandler() {
    const data = await this._service.getHysteroscopyService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addHysteroscopyReferenceImagesHandler() {
    const data = await this._service.addHysteroscopyReferenceImagesService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteHysteroscopyReferenceImageHandler() {
    const data = await this._service.deleteHysteroscopyReferenceImageService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = visitsController;
