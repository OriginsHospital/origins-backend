const CouponService = require("../services/couponService");
const Constants = require("../constants/constants");

class CouponController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new CouponService(
      this._request,
      this._response,
      this._next
    );
  }

  async getAllCouponHandler() {
    const data = await this._service.getAllCoupons(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteCouponHandler(){
    const data = await this._service.deleteCoupon(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createCouponHandler(){
    const data = await this._service.createCoupon(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editCouponHandler(){
    const data = await this._service.updateCoupon(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = CouponController;
