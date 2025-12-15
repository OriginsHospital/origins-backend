const EmbryologyService = require("../services/embryologyService");
const Constants = require("../constants/constants");

class EmbryologyController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new EmbryologyService(
      this._request,
      this._response,
      this._next
    );
  }

  async patientListForEmbryologyHandler() {
    const data = await this._service.patientListForEmbryologyService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveEmbryologyTreatmentHandler() {
    const data = await this._service.saveEmbryologyTreatmentService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveEmbryologyConsultationHandler() {
    const data = await this._service.saveEmbryologyConsultationService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getEmbryologyDataByTreamentCycleIdHandler() {
    const data = await this._service.getEmbryologyDataByTreamentCycleIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getEmbryologyDataByConsultationIdHandler() {
    const data = await this._service.getEmbryologyDataByConsultationIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editEmbryologyTreatmentHandler() {
    const data = await this._service.editEmbryologyTreatmentService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editEmbryologyConsultationHandler() {
    const data = await this._service.editEmbryologyConsultationService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  // async getEmbryologyDefaultTemplateHandler(){
  //   const data = await this._service.getEmbryologyDefaultTemplateService(
  //     this._request
  //   );
  //   this._response.status(200).send({
  //     status: 200,
  //     message: Constants.SUCCESS,
  //     data: data
  //   });
  // }

  async getEmbryologyTemplateByIdHandler() {
    const data = await this._service.getEmbryologyTemplateByIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async downloadEmbryologyReportHandler() {
    await this._service.downloadEmbryologyService(this._request);
  }

  async uploadEmbryologyImageHandler() {
    const data = await this._service.uploadEmbryologyImageService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteEmbryologyImageHandler() {
    const data = await this._service.deleteEmbryologyImageService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async downloadEmbryologyImagesHandler() {
    await this._service.downloadEmbryologyImagesService(this._request);
  }
}

module.exports = EmbryologyController;
