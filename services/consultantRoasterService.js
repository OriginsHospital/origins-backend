const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const { Sequelize } = require("sequelize");
const {
  createConsultantRoasterSchema,
  editConsultantRoasterSchema
} = require("../schemas/consultantRoasterSchema");
const ConsultantRoasterModel = require("../models/Master/ConsultantRoasterModel");
const {
  getAllConsultantRoastersList
} = require("../queries/consultant_roaster_queries");
const e = require("express");

class ConsultantRoasterService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
  }

  async createConsultantRoasterService() {
    const validatedPayload = await createConsultantRoasterSchema.validateAsync(
      this._request.body
    );

    return await this.mysqlConnection.transaction(async t => {
      const newlyCreatedRoaster = await ConsultantRoasterModel.create(
        {
          ...validatedPayload,
          createdBy: this._request?.userDetails?.id
        },
        { transaction: t }
      ).catch(err => {
        console.log("Error while creating roaster", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return newlyCreatedRoaster;
    });
  }

  async getAllConsultantRoastersService() {
    const data = await this.mysqlConnection
      .query(getAllConsultantRoastersList, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("error while getting roasters list", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async editConsultantRoasterService() {
    const validatedPayload = await editConsultantRoasterSchema.validateAsync(
      this._request.body
    );
    const { id, ...updatableFields } = validatedPayload;

    const consultantRoaster = await ConsultantRoasterModel.findOne({
      where: { id: id }
    }).catch(err => {
      console.log("Error while fetching roaster", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!consultantRoaster) {
      throw new createError.NotFound(Constants.CONSULTANT_ROASTER_NOT_FOUND);
    }

    return this.mysqlConnection.transaction(async t => {
      const updatedRoaster = await ConsultantRoasterModel.update(
        { ...updatableFields, updatedBy: this._request?.userDetails?.id },
        {
          where: { id: id },
          transaction: t
        }
      ).catch(err => {
        console.log("Error while updating roaster", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return Constants.SUCCESS;
    });
  }
}

module.exports = ConsultantRoasterService;
