const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const { Sequelize } = require("sequelize");

class NotificationsService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
  }

  async getNotificationsService() {
    const { limit = 50, offset = 0 } = this._request.query;
    const userId = this._request?.userDetails?.id;

    // For now, return empty array - can be extended later with actual notification logic
    // This prevents 404 errors while the notification system is being developed
    return [];
  }

  async getUnreadNotificationsCountService() {
    const userId = this._request?.userDetails?.id;

    // For now, return count of 0 - can be extended later with actual notification logic
    // This prevents 404 errors while the notification system is being developed
    return { count: 0 };
  }

  async markNotificationAsReadService() {
    const { notificationId } = this._request.params;
    const userId = this._request?.userDetails?.id;

    if (!notificationId) {
      throw new createError.BadRequest("Notification ID is required");
    }

    // For now, return success - can be extended later with actual notification logic
    return Constants.SUCCESS;
  }

  async markAllNotificationsAsReadService() {
    const userId = this._request?.userDetails?.id;

    // For now, return success - can be extended later with actual notification logic
    return Constants.SUCCESS;
  }
}

module.exports = NotificationsService;
