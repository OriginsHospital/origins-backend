const InboxService = require("../services/inboxService");
const Constants = require("../constants/constants");

class InboxController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new InboxService(request, response, next);
  }

  async getInboxItemsRouteHandler() {
    const data = await this._service.getInboxItemsService();
    this._response.status(200).json({
      status: 200,
      message: Constants.DATA_FETCHED_SUCCESS,
      data
    });
  }
}

module.exports = InboxController;
