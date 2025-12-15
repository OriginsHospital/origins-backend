const ApiService = require("../services/apiService");
const Constants = require("../constants/constants");

class ApiController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new ApiService(this._request, this._response, this._next);
  }
  dropdown;
  async dropdownOptionsHandler() {
    const data = await this._service.dropdownOptionsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getCitiesHandler() {
    const data = await this._service.getCitiesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getBillTypeValuesHandler() {
    const data = await this._service.getBillTypeValuesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async undoIcsiHandler() {
    const data = await this._service.undoIcsiService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getTreatmentTypesHandler() {
    const data = await this._service.getTreatmentTypeService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAllCitiesHandler() {
    const data = await this._service.getAllCitiesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}
module.exports = ApiController;
