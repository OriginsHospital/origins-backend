const { QueryTypes, Op } = require("sequelize");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const {
  savePersonListSchema,
  editPersonListSchema,
  getPersonSuggestionSchema,
  saveOtListSchema,
  saveInjectionDetailsSchema,
  editInjectionDetailsSchema,
  editOtListSchema
} = require("../schemas/otModuleSchemas");
const OTPersonMasterModel = require("../models/Master/otPersonMasterModel");
const OTListMasterModel = require("../models/Master/otListMasterModel");
const lodash = require("lodash");
const {
  getAllPersonsListQuery,
  getOtListQuery,
  getInjectionDetailsByDate,
  getAllPersonsListDesignationWiseQuery,
  getInjectionSuggestionListQuery
} = require("../queries/ot_module_queries");
const InjectionListMasterModel = require("../models/Master/injectionListMasterModel");

class OTModuleService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
  }

  async getAllPersonsListService() {
    return await this.mysqlConnection
      .query(getAllPersonsListQuery, {
        type: QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching all person details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async getAllPersonsListDesignationWiseService() {
    return await this.mysqlConnection
      .query(getAllPersonsListDesignationWiseQuery, {
        type: QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching all person details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async savePersonListService() {
    const {
      personName,
      designationId,
      phoneNumber
    } = await savePersonListSchema.validateAsync(this._request.body);
    return await OTPersonMasterModel.create({
      personName,
      designationId,
      phoneNumber
    }).catch(err => {
      console.log("Error while saving details of OT person ", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async editPersonDetailsService() {
    const {
      id,
      personName,
      designationId,
      phoneNumber
    } = await editPersonListSchema.validateAsync(this._request.body);
    const data = await OTPersonMasterModel.findOne({
      where: {
        id: id
      }
    }).catch(err => {
      console.log("Error while fetching details of person", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    await OTPersonMasterModel.update(
      { personName, designationId, phoneNumber },
      {
        where: {
          id: id
        }
      }
    ).catch(err => {
      console.log("Error while updating the person details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getPersonSuggestionService() {
    const {
      searchText,
      designationId
    } = await getPersonSuggestionSchema.validateAsync(this._request.body);
    const data = await OTPersonMasterModel.findAll({
      where: {
        personName: { [Op.like]: "" + `%${searchText}%` + "" },
        designationId: designationId
      },
      attributes: ["id", "personName"]
    }).catch(err => {
      console.log("Error while fetching person Names", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return data;
  }

  async saveOtDetailsService() {
    const validatedPayload = await saveOtListSchema.validateAsync(
      this._request.body
    );

    await OTListMasterModel.create(validatedPayload).catch(err => {
      console.log("Error while saving the details of OT master", err);
      throw new createError();
    });

    return Constants.SUCCESS;
  }

  async getOtListService() {
    const { fromDate, toDate } = this._request.query;
    let oTListQuery = getOtListQuery;

    let whereConditions = [];
    if (fromDate) {
      whereConditions.push("CAST(olm.procedureDate  AS DATE) >= :fromDate");
    }
    if (toDate) {
      whereConditions.push("CAST(olm.procedureDate  AS DATE) <= :toDate");
    }
    if (whereConditions.length > 0) {
      oTListQuery += ` WHERE ` + whereConditions.join(" AND ");
    }

    oTListQuery += ` order by olm.procedureDate  desc;`;

    return await this.mysqlConnection
      .query(oTListQuery, {
        type: QueryTypes.SELECT,
        replacements: {
          fromDate: fromDate,
          toDate: toDate
        }
      })
      .catch(err => {
        console.log("Error while fetching ot details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async editOtListService() {
    const validatedPayload = await editOtListSchema.validateAsync(
      this._request.body
    );

    const data = await OTListMasterModel.findOne({
      where: {
        id: validatedPayload.id
      }
    }).catch(err => {
      console.log("Error while getting the details of OT master", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    await this.mysqlConnection.transaction(async t => {
      await OTListMasterModel.destroy({
        where: {
          id: validatedPayload.id
        },
        transaction: t
      }).catch(err => {
        console.log("Error while deleting the details of ot list", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      delete validatedPayload.id;
      await OTListMasterModel.create(validatedPayload, {
        transaction: t
      }).catch(err => {
        console.log("Error while saving the details of OT master", err);
        throw new createError();
      });
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getInjectionListService() {
    const { fromDate, toDate } = this._request.query;
    let injectionListQuery = getInjectionDetailsByDate;

    let whereConditions = [];
    if (fromDate) {
      whereConditions.push("CAST(ilm.administeredDate  AS DATE) >= :fromDate");
    }
    if (toDate) {
      whereConditions.push("CAST(ilm.administeredDate  AS DATE) <= :toDate");
    }
    if (whereConditions.length > 0) {
      injectionListQuery += ` WHERE ` + whereConditions.join(" AND ");
    }

    injectionListQuery += ` order by ilm.administeredDate  desc;`;

    return this.mysqlConnection
      .query(injectionListQuery, {
        type: QueryTypes.SELECT,
        replacements: {
          fromDate: fromDate,
          toDate: toDate
        }
      })
      .catch(err => {
        console.log("Error while getting injection details list", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async saveInjectionListService() {
    const validatedPayload = await saveInjectionDetailsSchema.validateAsync(
      this._request.body
    );

    return InjectionListMasterModel.create(validatedPayload).catch(err => {
      console.log("Error whole saving the injection details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async editInjectionListService() {
    const validatedPayload = await editInjectionDetailsSchema.validateAsync(
      this._request.body
    );

    const data = await InjectionListMasterModel.findOne({
      where: {
        id: validatedPayload.id
      }
    }).catch(err => {
      console.log(
        "Error while getting the details of Injection Details master",
        err
      );
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    const { id, ...rest } = validatedPayload;
    await InjectionListMasterModel.update(rest, {
      where: {
        id: validatedPayload.id
      }
    }).catch(err => {
      console.log(
        "Error while saving the details of injection details master",
        err
      );
      throw new createError();
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getInjectionSuggestionList() {
    const { itemName } = this._request.query;
    return await this.mysqlConnection
      .query(getInjectionSuggestionListQuery, {
        type: QueryTypes.SELECT,
        replacements: {
          itemName: `%${itemName}%`
        }
      })
      .catch(err => {
        console.log("Error while fetching injection list details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }
}

module.exports = OTModuleService;
