const UsersService = require("../services/usersService");
const Constants = require("../constants/constants");

class UsersController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new UsersService(this._request, this._response, this._next);
  }

  async getUserDetailsHandler() {
    const data = await this._service.getUserDetailsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getUsersListHandler() {
    const data = await this._service.getUsersListService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getBlockedUsersListHandler() {
    const data = await this._service.getBlockedUsersListService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getUsersListWithPaginationHandler() {
    const data = await this._service.getUsersListServiceWithPagination(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateUserDetailsHandler() {
    const data = await this._service.updateUserDetailsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getUserProfileInfoHandler() {
    const data = await this._service.getUserProfileInfoService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateUserProfileHandler() {
    const data = await this._service.updateUserProfileService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getBranchRequestHistoryHandler() {
    const data = await this._service.getBranchRequestHistoryService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async branchChangeRequestHandler() {
    const data = await this._service.branchChangeRequestService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async changePasswordHandler() {
    const data = await this._service.changePasswordService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getUserSuggestionHandler() {
    const data = await this._service.getUserSuggestion(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getValidUsersListHandler() {
    const data = await this._service.getValidUsersListService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = UsersController;
