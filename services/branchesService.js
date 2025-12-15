const createError = require("http-errors");
const BranchMasterModel = require("../models/Master/branchMaster");
const Constants = require("../constants/constants");

class BranchesService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
  }

  async getBranchesService() {
    let branchesList = await BranchMasterModel.findAll({}).catch(err => {
      console.log("error while fetching branches list", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    branchesList = branchesList.map(role => role.dataValues);
    return branchesList.map(branch => {
      const { id, name } = branch;
      return { id, name };
    });
  }
}

module.exports = BranchesService;
