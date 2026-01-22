const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const { Sequelize } = require("sequelize");
const {
  getTicketCommentsForInboxQuery,
  getTicketCommentsCountQuery
} = require("../queries/inbox_queries");
const { getAllAlerts } = require("./alertsService");

class InboxService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.currentUserId = this._request?.userDetails?.id;
  }

  // Get inbox items (alerts + comments)
  async getInboxItemsService() {
    try {
      const { page = 1, limit = 50, type = "all" } = this._request.query;
      const offset = (page - 1) * limit;

      const results = {
        alerts: [],
        ticketComments: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      };

      // Get alerts if type is 'all' or 'alerts'
      if (type === "all" || type === "alerts") {
        const AlertsService = require("./alertsService");
        const alertsService = new AlertsService(
          this._request,
          this._response,
          this._next
        );
        const alerts = await alertsService.getAllAlertsRouteService();
        results.alerts = alerts || [];
      }

      // Get ticket comments if type is 'all' or 'comments'
      if (type === "all" || type === "comments") {
        // Get ticket comments
        const comments = await this.mysqlConnection.query(
          getTicketCommentsForInboxQuery,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: {
              userId: this.currentUserId,
              limit: parseInt(limit),
              offset: parseInt(offset)
            }
          }
        );

        // Get total count
        const countResult = await this.mysqlConnection.query(
          getTicketCommentsCountQuery,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: {
              userId: this.currentUserId
            }
          }
        );

        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        results.ticketComments = comments || [];
        results.pagination = {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages
        };
      }

      return results;
    } catch (err) {
      console.error("Error in getInboxItemsService:", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }
}

module.exports = InboxService;
