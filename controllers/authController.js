const Constants = require("../constants/constants");
const AuthService = require("../services/authService");

class AuthController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new AuthService(this._request, this._response, this._next);
  }

  async loginEmailHandler() {
    const data = await this._service.loginEmailService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.USER_LOGIN_SUCCESS,
      data: data
    });
  }

  async forgotPasswordHandler() {
    const data = await this._service.forgotPasswordService();
    this._response.status(200).send({
      status: 200,
      message: Constants.EMAIL_SENT_SUCCESSFULLY,
      data: data
    });
  }

  async sendOtpHandler() {
    const data = await this._service.sendOtpService();
    this._response.status(200).send({
      status: 200,
      message: Constants.OTP_SENT_SUCCESSFULLY,
      data: data
    });
  }

  async verifyOtpHandler() {
    const data = await this._service.verifyOtpService();
    this._response.status(200).send({
      status: 200,
      message: Constants.USER_REGISTER_SUCCESS,
      data: data
    });
  }

  async resetPasswordGetHandler() {
    const data = await this._service.resetPasswordGetService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async resetPasswordPostHandler() {
    const data = await this._service.resetPasswordPostService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async loginDetectedGetHandler() {
    const data = await this._service.loginDetectedGetService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getUserInfoHandler() {
    const data = await this._service.getUserInfoService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async rejectUserHandler() {
    const data = await this._service.rejectUserService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteUserHandler() {
    const data = await this._service.deleteUserService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async logoutHandler() {
    const data = await this._service.logoutService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getNewAccessTokenHandler() {
    const data = await this._service.getNewAccessTokenService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async changePasswordHandler() {
    const data = await this._service.changePasswordService();
    this._response.status(200).send({
      status: 200,
      message: Constants.PASSWORD_CHANGED_SUCCESSFULLY,
      data: data
    });
  }
}

module.exports = AuthController;
