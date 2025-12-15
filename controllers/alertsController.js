const Constants = require("../constants/constants");
const AlertsService = require("../services/alertsService");

class AlertsController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new AlertsService(
      this._request,
      this._response,
      this._next
    );
  }

  async getAllAlertsRouteHandler() {
    const data = await this._service.getAllAlertsRouteService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createAlertRouteHandler() {
    const data = await this._service.createAlertRouteService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editAlertRouteHandler() {
    const data = await this._service.editAlertRouteService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteAlertRouteHandler() {
    const data = await this._service.deleteAlertRouteService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = AlertsController;
