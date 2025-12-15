const BranchesService = require("../services/branchesService");
const Constants = require("../constants/constants");

class BranchesController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new BranchesService(
      this._request,
      this._response,
      this._next
    );
  }

  async getBranchesHandler() {
    const data = await this._service.getBranchesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = BranchesController;
