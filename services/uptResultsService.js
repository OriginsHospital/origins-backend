const createError = require("http-errors");
const { QueryTypes } = require("sequelize");
const Constants = require("../constants/constants");
const MySqlConnection = require("../connections/mysql_connection");
const PatientMasterModel = require("../models/Master/patientMaster");
const {
  saveUptResultSchema,
  editUptResultSchema
} = require("../schemas/uptResultsSchema");
const {
  getUptResultsQuery,
  insertUptResultQuery,
  updateUptResultQuery,
  getUptResultByIdQuery
} = require("../queries/upt_results_queries");

class UptResultsService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
  }

  async resolvePatientMasterId(patientId) {
    let patient = await PatientMasterModel.findByPk(patientId).catch(
      () => null
    );
    if (!patient) {
      patient = await PatientMasterModel.findOne({
        where: { patientId: String(patientId) }
      }).catch(() => null);
    }
    if (!patient) {
      throw new createError.BadRequest("Patient not found");
    }
    return patient.id;
  }

  async getUptResultsService() {
    const {
      fromDate,
      toDate,
      branchId,
      cycleType,
      uptResult,
      createdByNurseId,
      search
    } = this._request.query;

    let query = getUptResultsQuery;
    const whereConditions = [];
    const replacements = {};

    if (fromDate) {
      whereConditions.push("ur.resultDate >= :fromDate");
      replacements.fromDate = fromDate;
    }
    if (toDate) {
      whereConditions.push("ur.resultDate <= :toDate");
      replacements.toDate = toDate;
    }
    if (branchId) {
      whereConditions.push("ur.branchId = :branchId");
      replacements.branchId = branchId;
    }
    if (cycleType) {
      whereConditions.push("ur.cycleType = :cycleType");
      replacements.cycleType = cycleType;
    }
    if (uptResult) {
      whereConditions.push("ur.uptResult = :uptResult");
      replacements.uptResult = uptResult;
    }
    if (createdByNurseId) {
      whereConditions.push("ur.createdByNurseId = :createdByNurseId");
      replacements.createdByNurseId = createdByNurseId;
    }
    if (search && String(search).trim()) {
      whereConditions.push(
        `(CONCAT(pm.lastName, ' ', COALESCE(pm.firstName, '')) LIKE :search
          OR pm.patientId LIKE :search
          OR pm.mobileNo LIKE :search)`
      );
      replacements.search = `%${String(search).trim()}%`;
    }

    if (whereConditions.length > 0) {
      query += ` AND ${whereConditions.join(" AND ")}`;
    }

    query += ` ORDER BY ur.resultDate DESC, ur.id DESC`;

    return this.mysqlConnection
      .query(query, {
        type: QueryTypes.SELECT,
        replacements
      })
      .catch(err => {
        console.log("Error while getting UPT results list", err.message);
        if (err.message && err.message.includes("upt_results")) {
          throw new createError.InternalServerError(
            "UPT results table is missing. Please run database migration 047_create_upt_results.sql"
          );
        }
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async saveUptResultService() {
    const { error, value } = saveUptResultSchema.validate(this._request.body, {
      convert: true,
      stripUnknown: true
    });
    if (error) {
      throw new createError.BadRequest(error.details[0].message);
    }

    const patientMasterId = await this.resolvePatientMasterId(value.patientId);
    const createdBy = this._request.userDetails?.id || null;

    try {
      const [insertId] = await this.mysqlConnection.query(
        insertUptResultQuery,
        {
          replacements: {
            resultDate: value.resultDate,
            branchId: value.branchId,
            patientId: patientMasterId,
            cycleType: value.cycleType,
            uptResult: value.uptResult,
            createdByNurseId: value.createdByNurseId,
            createdBy
          },
          type: QueryTypes.INSERT
        }
      );

      const rows = await this.mysqlConnection.query(getUptResultByIdQuery, {
        type: QueryTypes.SELECT,
        replacements: { id: insertId }
      });

      return rows?.[0] || { id: insertId };
    } catch (err) {
      console.log("Error while saving UPT result", err.message);
      if (err.message && err.message.includes("upt_results")) {
        throw new createError.InternalServerError(
          "UPT results table is missing. Please run database migration 047_create_upt_results.sql"
        );
      }
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async editUptResultService() {
    const { error, value } = editUptResultSchema.validate(this._request.body, {
      convert: true,
      stripUnknown: true
    });
    if (error) {
      throw new createError.BadRequest(error.details[0].message);
    }

    const existing = await this.mysqlConnection
      .query(getUptResultByIdQuery, {
        type: QueryTypes.SELECT,
        replacements: { id: value.id }
      })
      .catch(err => {
        console.log("Error while fetching UPT result", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!existing?.length) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    const patientMasterId = await this.resolvePatientMasterId(value.patientId);

    await this.mysqlConnection
      .query(updateUptResultQuery, {
        replacements: {
          id: value.id,
          resultDate: value.resultDate,
          branchId: value.branchId,
          patientId: patientMasterId,
          cycleType: value.cycleType,
          uptResult: value.uptResult,
          createdByNurseId: value.createdByNurseId
        }
      })
      .catch(err => {
        console.log("Error while updating UPT result", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    const rows = await this.mysqlConnection.query(getUptResultByIdQuery, {
      type: QueryTypes.SELECT,
      replacements: { id: value.id }
    });

    return rows?.[0] || { id: value.id };
  }
}

module.exports = UptResultsService;
