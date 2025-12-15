const createError = require("http-errors");
const RoleMasterModel = require("../models/Master/roleMaster");
const RoleModuleAssociationModel = require("../models/Associations/roleModuleAssociation");
const MySqlConnection = require("../connections/mysql_connection");
const Constants = require("../constants/constants");
const { getRoleDetails } = require("../queries/roles_queries");
const { Sequelize } = require("sequelize");
const { editRoleSchema, addRoleSchema } = require("../schemas/roleSchemas");
const lodash = require("lodash");
class RolesService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mySqlConnection = MySqlConnection._instance;
  }

  async getRoleDetailsService() {
    const roleId = this._request.params.id;
    const data = await this.mySqlConnection
      .query(getRoleDetails, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          roleId: roleId
        }
      })
      .catch(err => {
        console.log("Error while getting roleDetails", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return lodash.isEmpty(data) ? null : data[0];
  }

  async getRolesService() {
    let rolesList = await RoleMasterModel.findAll({}).catch(err => {
      console.log("error while fetching roles list", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    rolesList = rolesList.map(role => role.dataValues);
    return rolesList.map(role => {
      const { id, name } = role;
      return { id, name };
    });
  }

  async addRoleService() {
    this._request.body = await addRoleSchema.validateAsync(this._request.body);
  }

  async deleteRoleService() {}

  // Invalid. Need to test
  async editRoleService() {
    this._request.body = await editRoleSchema.validateAsync(this._request.body);
    const isExists = await RoleMasterModel.findOne({
      where: {
        id: this._request.body.id
      }
    });
    if (lodash.isEmpty(isExists)) {
      throw new createError.NotFound(Constants.DATA_NOT_FOUND);
    }
    const moduleInformation = this._request.body.moduleList.map(module => {
      return {
        roleId: this._request.body.id,
        moduleId: module.id,
        accessType: module.accessType
      };
    });

    await this.mySqlConnection.transaction(async t => {
      await RoleModuleAssociationModel.destroy({
        where: {
          roleId: this._request.body.id
        },
        transaction: t
      }).catch(err => {
        console.log("Error while deleting role module association", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await RoleMasterModel.update(
        { name: this._request.body.name },
        {
          where: {
            id: this._request.body.id
          },
          transaction: t
        }
      ).catch(err => {
        console.log("Error while updating role details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await RoleModuleAssociationModel.bulkCreate(moduleInformation, {
        transaction: t
      }).catch(err => {
        console.log("Error while creating bulk role module assoication", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return Constants.DATA_UPDATED_SUCCESS;
    });
  }
}

module.exports = RolesService;
