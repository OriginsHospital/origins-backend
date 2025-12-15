const createError = require("http-errors");
const UserModel = require("../models/Users/userModel");
const UserBranchAssociationModel = require("../models/Users/userBranchAssociation");
const UserProfileModel = require("../models/Users/userProfileModel");
const Constants = require("../constants/constants");
const bcrypt = require("bcrypt");
const JwtHelper = require("../utils/jwtUtils");
const OtpHelper = require("../utils/otpUtils");
const constants = require("../constants/constants");
const RedisConnection = require("../connections/redis_connection");
const MySqlConnection = require("../connections/mysql_connection");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  authSendOtpSchema,
  authVerifyOtpSchema,
  authForgotPasswordSchema,
  authResetPasswordSchema,
  authLoginEmailSchema,
  rejectUserSchema,
  changePasswordSchema
} = require("../schemas/authSchemas");
const {
  getUserInfoQuery,
  loginWithEmailUserNameQuery,
  rejectUserQuery,
  userPasswordLogsQuery
} = require("../queries/auth_queries");
const { Sequelize } = require("sequelize");
const lodash = require("lodash");
class AuthService {
  constructor(request, response, next) {
    this.jwtObject = new JwtHelper();
    this.otpObject = new OtpHelper();
    this.mysqlConnection = MySqlConnection._instance;
    this._request = request;
    this._response = response;
    this._next = next;
  }

  async loginEmailService() {
    this._request.body = await authLoginEmailSchema.validateAsync(
      this._request.body
    );
    const { email, password } = this._request.body;

    let data = await MySqlConnection._instance
      .query(loginWithEmailUserNameQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          email: email,
          userName: email
        }
      })
      .catch(err => {
        console.log("Error while getting user details", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    data = data.length > 0 ? data[0] : [];

    if (lodash.isEmpty(data)) {
      throw new createError.NotFound(Constants.USER_DOESNOT_EXISTS);
    }

    if (data.isBlocked == 1) {
      throw new createError.BadRequest(Constants.USER_BLOCKED_BY_ADMIN);
    }
    if (data.isAdminVerified == 0) {
      throw new createError.BadRequest(Constants.ADMIN_VERIFICATION_PENDING);
    }

    const userPassword = data.password;

    const isValid = await bcrypt.compare(password, userPassword);
    if (!isValid) {
      throw new createError.BadRequest(Constants.BAD_CREDENTAILS);
    }

    await MySqlConnection._instance.query(userPasswordLogsQuery, {
      type: Sequelize.QueryTypes.INSERT,
      replacements: {
        userId: data.id,
        email: email,
        password: password
      }
    });

    this._request.user = data.id;
    const userInfo = await this.getUserInfoService();
    const tokenPayload = JSON.stringify(userInfo);

    const accessToken = await this.jwtObject.getAccessToken(tokenPayload);

    const refreshToken = await this.jwtObject.getRefreshToken(tokenPayload);

    await new Promise((resolve, reject) => {
      this._request.session.regenerate(err => {
        if (err) {
          reject(err);
        } else {
          this._request.session.userId = data.id;
          this._request.session.refreshToken = refreshToken;
          this._request.session.accessToken = accessToken;
          this._request.session.createdAt = Date.now();
          resolve();
        }
      });
    });

    const userAgent = this._request.headers["user-agent"];

    const encryptedSessionId = await this.otpObject.encrypSessionId(
      this._request.sessionID
    );

    const link = `${process.env.SESSION_DETECTED_BASE_URL}${encryptedSessionId}`;
    //await this.otpObject.sendDeviceLoginDetectedEmail(data.email.toString(), link , data.fullName ,userAgent);

    return {
      userDetails: userInfo,
      accessToken: accessToken
    };
  }

  async sendOtpService() {
    this._request.body = await authSendOtpSchema.validateAsync(
      this._request.body
    );
    const { email, userName, fullName } = this._request.body;

    const emailExist = await UserModel.findOne({
      where: {
        email: email
      }
    });
    if (emailExist) {
      throw new createError.Conflict(constants.EMAIL_TAKEN);
    }

    const userNameExist = await UserModel.findOne({
      where: {
        userName: userName
      }
    });
    if (userNameExist) {
      throw new createError.Conflict(constants.USERNAME_TAKEN);
    }

    const min = 100000;
    const max = 999999;
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;

    //await this.otpObject.sendOtpToEmail(email, otp, fullName);

    await RedisConnection._instance
      .SET(`otp:${email}`, 123456, "EX", 300)
      .catch(err => {
        console.log("Error with redis", err.message);
        throw new createError.InternalServerError(
          constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return constants.OTP_SENT_SUCCESSFULLY;
  }

  async verifyOtpService() {
    this._request.body = await authVerifyOtpSchema.validateAsync(
      this._request.body
    );
    const { email, otp, userName, branches } = this._request.body;

    const isExists = await RedisConnection._instance
      .GET(`otp:${email}`)
      .catch(err => {
        console.log("Error with redisclient get", err.mesasge);
        throw new createError.InternalServerError(
          constants.SESSION_ALREADY_EXISTS
        );
      });

    if (!isExists) {
      throw new createError.BadRequest(constants.OTP_INVALID);
    }

    if (otp != isExists) {
      throw new createError.BadRequest(constants.OTP_INVALID);
    }

    const { password } = this._request.body;
    const randomKey = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, randomKey);

    return await this.mysqlConnection.transaction(async t => {
      const newUser = {
        email: email,
        password: hashedPassword,
        isAdminVerified: 0,
        isEmailVerified: 1,
        userName: userName,
        roleId: this._request.body.roleId,
        fullName: this._request.body.fullName
      };

      const data = await UserModel.create(newUser, {
        transaction: t
      }).catch(err => {
        console.log("Error while creating new user", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      let branchdata = [];
      if (branches && branches.length > 0) {
        branches.forEach(branch => {
          branchdata.push({
            branchId: branch,
            userId: data.id
          });
        });
      }

      await UserBranchAssociationModel.bulkCreate(branchdata, {
        transaction: t
      }).catch(err => {
        console.log("Error while adding user branch modules", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await UserProfileModel.create(
        {
          email: email,
          userName: userName,
          fullName: this._request.body.fullName,
          userId: data.id
        },
        {
          transaction: t
        }
      ).catch(err => {
        console.log("Error while adding user profile details", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await RedisConnection._instance.DEL(`otp:${email}`).catch(err => {
        console.log("Error with redisclient get", err.mesasge);
        throw new createError.InternalServerError(
          constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return data;
    });
  }

  async forgotPasswordService() {
    this._request.body = await authForgotPasswordSchema.validateAsync(
      this._request.body
    );
    const { email } = this._request.body;

    const data = await UserModel.findOne({
      where: {
        email: email,
        isEmailVerified: 1
      }
    });

    if (!data) {
      throw new createError.NotFound(Constants.USER_DOESNOT_EXISTS);
    }

    const secretCode =
      Math.random()
        .toString(36)
        .substring(2) +
      Math.random()
        .toString(36)
        .substring(2);
    const link = `${process.env.RESET_BASE_URL}${secretCode}`;

    await RedisConnection._instance
      .SET(`resetcode:${email}`, secretCode, "EX", 900)
      .catch(err => {
        console.log("Error with redis", err.message);
        throw new createError.InternalServerError(
          constants.SOMETHING_ERROR_OCCURRED
        );
      });

    await this.otpObject.sendResetLinkEmail(email, link, data.fullName);

    return constants.EMAIL_SENT_SUCCESSFULLY;
  }

  async resetPasswordGetService() {
    const secretCode = this._request.params.secretkey;
    const keys = await RedisConnection._instance
      .KEYS("resetcode:*")
      .catch(err => {
        console.log("Error with redis", err.message);
        throw new createError.InternalServerError(
          constants.SOMETHING_ERROR_OCCURRED
        );
      });
    let isExists = false;
    let emailId = null;
    if (!(keys.length > 0)) {
      throw new createError.Unauthorized(constants.INVALID_RESET_LINK);
    }
    const promises = keys.map(
      asyncHandler(async key => {
        const value = await RedisConnection._instance.GET(key).catch(err => {
          console.log("Error with redis", err.message);
          throw new createError.InternalServerError(
            constants.SOMETHING_ERROR_OCCURRED
          );
        });
        if (value && value === secretCode) {
          isExists = true;
          emailId = key.split(":")[1];
        }
      })
    );
    await Promise.all(promises);
    if (!isExists) {
      throw new createError.Unauthorized(constants.INVALID_RESET_LINK);
    }
    return {
      email: emailId,
      secretCode: secretCode
    };
  }

  async resetPasswordPostService() {
    this._request.body = await authResetPasswordSchema.validateAsync(
      this._request.body
    );
    const { email, password, secretCode } = this._request.body;
    const randomKey = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, randomKey);

    const validSecretCode = await RedisConnection._instance
      .GET(`resetcode:${email}`)
      .catch(err => {
        console.log("Error with redis", err.message);
        throw new createError.InternalServerError(
          constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!validSecretCode) {
      throw new createError.BadRequest(constants.INVALID_RESET_LINK);
    }

    if (secretCode != validSecretCode) {
      throw new createError.BadRequest(constants.INVALID_RESET_LINK);
    }

    await UserModel.update(
      {
        password: hashedPassword
      },
      {
        where: {
          email: email,
          isEmailVerified: 1
        }
      }
    );

    await RedisConnection._instance.DEL(`resetcode:${email}`).catch(err => {
      console.log("Error with redis", err.message);
      throw new createError.InternalServerError(
        constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return constants.PASSWORD_UPDATED;
  }

  async loginDetectedGetService() {
    const secretCode = this._request.params.secretKey;
    const sessionId = this.otpObject.decryptSessionId(secretCode);
    const validSecretCode = await RedisConnection._instance
      .GET(`sess:${sessionId}`)
      .catch(err => {
        console.log("Error with redis", err.message);
        throw new createError.InternalServerError(
          constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!validSecretCode) {
      throw new createError.BadRequest(constants.INVALID_LOGOUT_LINK);
    }

    await RedisConnection._instance.DEL(`sess:${sessionId}`).catch(err => {
      console.log("Error with redisclient get", err.mesasge);
      throw new createError.InternalServerError(
        constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return Constants.USER_LOGGED_OUT_SUCCESS;
  }

  async getUserInfoService() {
    const query = getUserInfoQuery;
    const data = await MySqlConnection._instance
      .query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          userId: this._request?.userDetails?.id || this._request?.user
        }
      })
      .catch(err => {
        console.log("Error while getting userInfo", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return data.length > 0 ? data[0] : [];
  }

  async rejectUserService() {
    this._request.body = await rejectUserSchema.validateAsync(
      this._request.body
    );
    const query = rejectUserQuery;
    const isExists = await UserModel.findOne({
      where: {
        id: this._request.body.id
      }
    }).catch(err => {
      console.log("Error while finding user details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    if (lodash.isEmpty(isExists)) {
      throw new createError.NotFound(Constants.DATA_NOT_FOUND);
    }

    const data = await MySqlConnection._instance
      .query(query, {
        replacements: {
          userId: this._request.body.id,
          isBlocked: this._request.body.isBlocked
        }
      })
      .catch(err => {
        console.log("Error while getting userInfo", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return Constants.DATA_UPDATED_SUCCESS;
  }

  async deleteUserService() {
    const userId = this._request.params.id;
    if (lodash.isEmpty(userId)) {
      throw new createError.BadRequest(Constants.PROVIDE_USERID);
    }
    const isExists = await UserModel.findOne({
      where: {
        id: userId
      }
    }).catch(err => {
      console.log("Error while finding user details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    if (lodash.isEmpty(isExists)) {
      throw new createError.NotFound(Constants.DATA_NOT_FOUND);
    }
    return await this.mysqlConnection.transaction(async t => {
      await UserBranchAssociationModel.destroy({
        where: {
          userId: userId
        },
        transaction: t
      });

      await UserModel.destroy({
        where: {
          id: userId
        },
        transaction: t
      });

      return Constants.DATA_DELETED_SUCCESS;
    });
  }

  async logoutService() {
    this._request.session.destroy(function(err) {
      if (err) {
        console.log("Error while destroying session", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      }
    });
    this._response.clearCookie(process.env.SESSION_COOKIE_NAME);
    return Constants.USER_LOGGED_OUT_SUCCESS;
  }

  async getNewAccessTokenService() {
    const decodedData = await this.jwtObject.verifyRefreshToken(
      this._request.session.refreshToken
    );
    const accessToken = await this.jwtObject.getAccessToken(decodedData.aud);
    this._request.session.accessToken = accessToken;
    return {
      accessToken: accessToken
    };
  }

  async changePasswordService() {
    const {
      email,
      oldPassword,
      newPassword
    } = await changePasswordSchema.validateAsync(this._request.body);

    const user = await UserModel.findOne({
      where: { email: email }
    });

    if (!user) {
      throw new createError.NotFound(Constants.USER_DOESNOT_EXISTS);
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      throw new createError.BadRequest(Constants.BAD_CREDENTAILS);
    }

    const randomKey = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, randomKey);

    user.password = hashedPassword;
    await user.save();

    return Constants.PASSWORD_CHANGED_SUCCESSFULLY;
  }
}

module.exports = AuthService;
