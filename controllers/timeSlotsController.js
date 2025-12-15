const TimeSlotsService = require("../services/timeSlotsService");
const Constants = require("../constants/constants");

class TimeSlotsController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new TimeSlotsService(
      this._request,
      this._response,
      this._next
    );
  }

  async getDoctorsListHandler() {
    const data = await this._service.getDoctorsListService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async blockTimeSlotsHandler() {
    const data = await this._service.blockTimeSlotsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getBlockedTimeSlotsHandler() {
    const data = await this._service.getBlockedTimeSlotsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = TimeSlotsController;
