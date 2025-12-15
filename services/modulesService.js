const ModuleMasterModel = require("../models/Master/moduleMaster");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const lodash = require("lodash");

class ModuleService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
  }

  async createModuleService() {}

  async getModuleDetailsService() {
    const moduleId = this._request.params.id;
    if (lodash.isEmpty(moduleId)) {
      throw new createError.BadRequest(Constants.ID_NOT_PROVIDED);
    }
  }

  async getModulesService() {
    const data = await ModuleMasterModel.findAll({
      where: {
        isActive: 1
      }
    }).catch(err => {
      console.log("Error while fetching module list", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return data.map(module => {
      return {
        id: module.id,
        name: module.name
      };
    });
  }

  async editModuleService() {}
}

module.exports = ModuleService;
