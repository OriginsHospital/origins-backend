const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const CouponMasterModel = require("../models/Master/couponMaster");
const {
  createCouponSchema,
  editCouponSchema
} = require("../schemas/couponSchemas");
const lodash = require("lodash");
const { getAllCouponList } = require("../queries/coupon_queries");
const { Sequelize, Op } = require("sequelize");

class CouponService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
  }

  async createCoupon() {
    const validatedPayload = await createCouponSchema.validateAsync(
      this._request.body
    );

    const { couponCode } = validatedPayload;
    const data = await CouponMasterModel.findOne({
      where: {
        couponCode: couponCode
      }
    }).catch(err => {
      console.log("Error while finding details of coupon code");
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.COUPON_NAME_EXISTS);
    }

    return await CouponMasterModel.create({
      ...validatedPayload,
      createdBy: this._request?.userDetails?.id
    }).catch(err => {
      console.log("Error while creating couponse", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async getAllCoupons() {
    const data = await this.mysqlConnection
      .query(getAllCouponList, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("error while getting coupon list", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async deleteCoupon() {
    const { id } = this._request.params;
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR("{params}", "coupon id")
      );
    }

    const data = await CouponMasterModel.findOne({
      where: {
        id: id
      }
    }).catch(err => {
      console.log("Error while finding details of coupon code", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.COUPON_DOES_NOT_EXISTS);
    }

    await CouponMasterModel.destroy({
      where: {
        id: id
      }
    }).catch(err => {
      console.log("Error while deleting the coupon details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DELETED_SUCCESSFULLY;
  }

  async updateCoupon() {
    const {
      id,
      couponCode,
      isActive,
      discountPercentage
    } = await editCouponSchema.validateAsync(this._request.body);
    const data = await CouponMasterModel.findOne({
      where: {
        id: id
      }
    }).catch(err => {
      console.log("Error while finding details of coupon code", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.COUPON_DOES_NOT_EXISTS);
    }
    // check name exists for other id
    const couponNameExists = await CouponMasterModel.findOne({
      where: {
        id: { [Op.ne]: id },
        couponCode: couponCode
      }
    });
    if (!lodash.isEmpty(couponNameExists)) {
      throw new createError.BadRequest(Constants.COUPON_NAME_EXISTS);
    }

    await CouponMasterModel.update(
      {
        isActive,
        discountPercentage,
        couponCode
      },
      {
        where: {
          id: id
        }
      }
    ).catch(err => {
      console.log("Error while updating the coupon details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }
}

module.exports = CouponService;
