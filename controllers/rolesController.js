const RolesService = require("../services/rolesService");
const Constants = require("../constants/constants");

class RolesController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new RolesService(this._request, this._response, this._next);
  }

  async addRoleHandler() {
    const data = await this._service.addRoleService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.USER_LOGIN_SUCCESS,
      data: data
    });
  }

  async getRolesHandler() {
    const data = await this._service.getRolesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getRoleDetailsHandler() {
    const data = await this._service.getRoleDetailsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editRoleHandler() {
    const data = await this._service.editRoleService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteRoleHandler() {
    const data = await this._service.deleteRoleService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.USER_LOGIN_SUCCESS,
      data: data
    });
  }
}

module.exports = RolesController;
