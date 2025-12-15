const IpService = require("../services/ipService");
const Constants = require("../constants/constants");

class IpController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new IpService(this._request, this._response, this._next);
  }

  async getIndentDetailsHandler() {
    const data = await this._service.getIndentDetailsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addNewIndentHandler() {
    const data = await this._service.addNewIndentService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getBuildingsHandler() {
    const data = await this._service.getBuildingsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getFloorsHandler() {
    const data = await this._service.getFloorsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getRoomHandler() {
    const data = await this._service.getRoomService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getBedsHandler() {
    const data = await this._service.getBedsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createIPRegistrationHandler() {
    const data = await this._service.createIPRegistrationService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getActiveIPHandler() {
    const data = await this._service.getActiveIPService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getClosedIPHandler() {
    const data = await this._service.getClosedIPService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getIPDataByIdHandler() {
    const data = await this._service.getIPDataByIdService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createIPNotesHandler() {
    const data = await this._service.createIPNotesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getIPNotesHistoryByIdHandler() {
    const data = await this._service.getIPNotesHistoryByIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async closeIpRegistrationHandler() {
    const data = await this._service.closeIpRegistrationService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async ipRoomChangeHandler() {
    const data = await this._service.ipRoomChangeService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = IpController;
