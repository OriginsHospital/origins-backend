const Constants = require("../constants/constants");
const BaseService = require("../services/baseService");

class BaseController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new BaseService(this._request, this._response, this._next);
  }

  async uploadToS3BucketRouteHandler() {
    const data = await this._service.uploadToS3BucketRouteService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.UPLOADED_TO_S3_BUCKET_SUCCESSFULLY,
      data: data
    });
  }
}

module.exports = BaseController;
