const Constants = require("../constants/constants");
const NotificationsService = require("../services/notificationsService");

class NotificationsController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new NotificationsService(
      this._request,
      this._response,
      this._next
    );
  }

  async getNotificationsRouteHandler() {
    const data = await this._service.getNotificationsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getUnreadNotificationsCountRouteHandler() {
    const data = await this._service.getUnreadNotificationsCountService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async markNotificationAsReadRouteHandler() {
    const data = await this._service.markNotificationAsReadService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async markAllNotificationsAsReadRouteHandler() {
    const data = await this._service.markAllNotificationsAsReadService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = NotificationsController;
