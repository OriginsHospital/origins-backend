const ModulesService = require("../services/modulesService");
const Constants = require("../constants/constants");

class ModulesController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new ModulesService(
      this._request,
      this._response,
      this._next
    );
  }

  async createModuleHandler() {}

  async getModuleDetailsHandler() {
    const data = await this._service.getModuleDetailsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getModulesHandler() {
    const data = await this._service.getModulesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editModuleHandler() {}
}

module.exports = ModulesController;
