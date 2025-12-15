const createError = require("http-errors");
const Constants = require("../constants/constants");
const {
  getUsersListSchema,
  branchChangeRequestSchema,
  changePasswordSchema
} = require("../schemas/userSchemas");
const MySqlConnection = require("../connections/mysql_connection");
const UserBranchAssociationModel = require("../models/Users/userBranchAssociation");
const UserModuleAssociationModel = require("../models/Associations/userModuleAssociations");
const UserModel = require("../models/Users/userModel");
const UserProfileModel = require("../models/Users/userProfileModel");
const {
  userCountQuery,
  getUsersListQuery,
  getUserDetailsQuery,
  getUsersListQueryWithPagination,
  userProfileQuery,
  branchRequestHistoryQuery,
  getUserSuggestionQuery,
  getBlockedUsersListQuery,
  getValidUsersQuery
} = require("../queries/user_queries");
const { Sequelize, Op } = require("sequelize");
const lodash = require("lodash");
const branchChangeRequestMasterModel = require("../models/Master/branchChangeRequestMaster");
const moment = require("moment-timezone");
const UsersModel = require("../models/Users/userModel");
const bcrypt = require("bcrypt");

class UsersService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
  }

  async getUserDetailsService() {
    const userId = this._request.params.id;
    if (lodash.isEmpty(userId)) {
      throw new createError.BadRequest(Constants.ID_NOT_PROVIDED);
    }
    const data = await this.mysqlConnection.query(getUserDetailsQuery, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: {
        userId: userId
      }
    });

    return data;
  }

  async getUsersListServiceWithPagination() {
    this._request.body = await getUsersListSchema.validateAsync(
      this._request.body
    );
    const currentUserBranchId = this._request.userDetails.branchDetails.map(
      branch => {
        return branch.id;
      }
    );
    const page = +this._request.query.page || 1;
    const limit = +this._request.query.limit || 10;
    const offset = (page - 1) * limit;
    const totalUsers = await this.mysqlConnection
      .query(userCountQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          isVerified: this._request.body.isVerified,
          branchId: currentUserBranchId.map(branch => String(branch))
        }
      })
      .catch(err => {
        console.log("Error while getting user count", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    const totalPages = Math.ceil(totalUsers[0].count / limit);
    const data = await this.mysqlConnection
      .query(getUsersListQueryWithPagination, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          limit: limit,
          offset: offset,
          isVerified: this._request.body.isVerified,
          branchId: currentUserBranchId.map(branch => String(branch))
        }
      })
      .catch(err => {
        console.log("Error while getting userList", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    const responseObj = {
      users: data,
      page: page,
      totalPages: totalPages,
      totalUsers: totalUsers[0].count
    };

    return responseObj;
  }

  async getUsersListService() {
    this._request.body = await getUsersListSchema.validateAsync(
      this._request.body
    );
    const currentUserBranchId = this._request.userDetails.branchDetails.map(
      branch => {
        return branch.id;
      }
    );
    const data = await this.mysqlConnection
      .query(getUsersListQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          isVerified: this._request.body.isVerified,
          branchId: currentUserBranchId.map(branch => String(branch)),
          userId: this._request.userDetails.id
        }
      })
      .catch(err => {
        console.log("Error while getting userList", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async getBlockedUsersListService() {
    const blockedUsers = await this.mysqlConnection
      .query(getBlockedUsersListQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting blockedUsers", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return blockedUsers;
  }

  async updateUserDetailsService() {
    let branchdata = [];
    if (!lodash.isEmpty(this._request.body.branchDetails)) {
      this._request.body.branchDetails.forEach(branch => {
        branchdata.push({
          branchId: branch.id,
          userId: this._request.body.id
        });
      });
    }
    let moduleDetails = [];
    if (!lodash.isEmpty(this._request.body.moduleList)) {
      this._request.body.moduleList.forEach(module => {
        moduleDetails.push({
          userId: this._request.body.id,
          moduleId: module.id,
          accessType: module.accessType
        });
      });
    }

    return await this.mysqlConnection.transaction(async t => {
      await UserBranchAssociationModel.destroy({
        where: {
          userId: this._request.body.id
        },
        transaction: t
      }).catch(err => {
        console.log("error while deelting user branch", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await UserModuleAssociationModel.destroy({
        where: {
          userId: this._request.body.id
        },
        transaction: t
      }).catch(err => {
        console.log("error while deleting user module", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await UserBranchAssociationModel.bulkCreate(branchdata, {
        transaction: t
      }).catch(err => {
        console.log("error while adding branch details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await UserModuleAssociationModel.bulkCreate(moduleDetails, {
        transaction: t
      }).catch(err => {
        console.log("Error while saving module details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await UserModel.update(
        {
          roleId: this._request.body.roleDetails.id,
          isAdminVerified: 1
        },
        {
          where: {
            id: this._request.body.id
          },
          transaction: t
        }
      ).catch(err => {
        console.log("Error while saving module details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return Constants.DATA_UPDATED_SUCCESS;
    });
  }

  async getUserProfileInfoService() {
    const userId = this._request.userDetails.id;
    const data = await this.mysqlConnection
      .query(userProfileQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          userId: userId
        }
      })
      .catch(err => {
        console.log("Error while getting userProfile Information", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    if (!lodash.isEmpty(data)) {
      return data[0];
    }
    return Constants.DATA_NOT_FOUND;
  }

  async updateUserProfileService() {
    const {
      userName,
      fullName,
      addressLine1,
      addressLine2,
      phoneNo,
      state,
      country
    } = this._request.body;
    const userId = this._request.userDetails.id;

    if (userName) {
      const isUserNameExists = await UserProfileModel.findOne({
        where: {
          userId: { [Op.ne]: userId },
          userName: userName
        }
      });
      if (!lodash.isEmpty(isUserNameExists)) {
        throw new createError.BadRequest(Constants.USERNAME_TAKEN);
      }
    }
    if (phoneNo) {
      const isPhoneExists = await UserProfileModel.findOne({
        where: {
          userId: { [Op.ne]: userId },
          phoneNo: phoneNo
        }
      });
      if (!lodash.isEmpty(isPhoneExists)) {
        throw new createError.BadRequest(Constants.PHONE_TAKEN);
      }
    }

    await UserProfileModel.update(
      {
        userName,
        fullName,
        addressLine1,
        addressLine2,
        phoneNo,
        state,
        country
      },
      {
        where: {
          userId: userId
        }
      }
    ).catch(err => {
      console.log("Error while updating the user details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getBranchRequestHistoryService() {
    const userId = this._request?.userDetails?.id;

    const data = await this.mysqlConnection
      .query(branchRequestHistoryQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          userId: userId
        }
      })
      .catch(err => {
        console.log(
          "Error while getting branch request history Information",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return !lodash.isEmpty(data) ? data : [];
  }

  async branchChangeRequestService() {
    const userId = this._request?.userDetails?.id;
    const branchRequestData = await branchChangeRequestSchema.validateAsync(
      this._request.body
    );

    const insertdata = {
      ...branchRequestData,
      requestStatus: "PENDING",
      requestedDate: moment()
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss.SSS"),
      userId: userId
    };

    const data = await branchChangeRequestMasterModel
      .findOne({
        where: {
          userId: userId,
          requestStatus: "PENDING"
        }
      })
      .catch(err => {
        console.log("Error while fetching the branch details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.BRANCH_REQUEST_EXISTS);
    }

    await branchChangeRequestMasterModel.create(insertdata).catch(err => {
      console.log("Error while adding the branch request details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return Constants.SUCCESS;
  }

  async changePasswordService() {
    const userId = this._request?.userDetails?.id;
    const changePasswordValidatedData = await changePasswordSchema.validateAsync(
      this._request.body
    );
    const { oldPassword, newPassword } = changePasswordValidatedData;

    const existedUserData = await UsersModel.findOne({ where: { id: userId } });
    if (!existedUserData) {
      throw new createError.NotFound(Constants.USER_DOESNOT_EXISTS);
    }

    const isValid = await bcrypt.compare(oldPassword, existedUserData.password);
    if (!isValid) {
      throw new createError.BadRequest(
        Constants.CHANGE_PASSWORD_BAD_CREDENTIALS
      );
    }

    const newRandomKey = await bcrypt.genSalt(12);
    const newHashedPassword = await bcrypt.hash(newPassword, newRandomKey);

    existedUserData.password = newHashedPassword;
    await existedUserData.save();

    return Constants.PASSWORD_UPDATED_SUCCESSFULLY;
  }

  async getUserSuggestion() {
    const { searchQuery } = this._request.query;
    const data = await this.mysqlConnection
      .query(getUserSuggestionQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          searchQuery: `%${searchQuery}%`
        }
      })
      .catch(err => {
        console.log("Error while getting userList", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async getValidUsersListService() {
    const data = await this.mysqlConnection
      .query(getValidUsersQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting userList", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }
}

module.exports = UsersService;
