const Constants = require("../constants/constants");
const createError = require("http-errors");
const { Op } = require("sequelize");
const lodash = require("lodash");
const PatientTrackerModel = require("../models/Master/patientTrackerMaster");
const {
  createPatientTrackerSchema,
  editPatientTrackerSchema
} = require("../schemas/patientTrackerSchema");

const normalizeTreatmentType = value => {
  if (!value) return value;
  const normalized = String(value)
    .trim()
    .toUpperCase()
    .replace(/\+/g, "-")
    .replace(/\s+/g, "-");
  if (normalized === "OI-TI" || normalized === "OITI") return "OI-TI";
  if (normalized === "IVF") return "IVF";
  if (normalized === "IUI") return "IUI";
  return value;
};

const toNullableDate = value => {
  if (value === undefined || value === null || value === "") return null;
  return value;
};

const toNumberOrZero = value => {
  if (value === undefined || value === null || value === "") return 0;
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const buildPayload = (body, userId, isCreate = false) => {
  const packageAmount = toNumberOrZero(body.packageAmount);
  const paidAmount = toNumberOrZero(body.paidAmount);
  const numberOfEmbryos = toNumberOrZero(body.numberOfEmbryos);
  const numberOfEmbryosUsed = toNumberOrZero(body.numberOfEmbryosUsed);

  const payload = {
    date: body.date,
    branchId: body.branchId,
    patientId: body.patientId,
    patientName: body.patientName,
    mobileNumber: body.mobileNumber || null,
    referralSourceId: body.referralSourceId || null,
    referralName: body.referralName || null,
    plan: body.plan || null,
    treatmentType: normalizeTreatmentType(body.treatmentType),
    cycleStatus: body.cycleStatus,
    stageOfCycle: body.stageOfCycle || null,
    packageName: body.packageName || null,
    packageAmount,
    registrationAmount: toNumberOrZero(body.registrationAmount),
    paidAmount,
    pendingAmount:
      body.pendingAmount !== undefined && body.pendingAmount !== null
        ? toNumberOrZero(body.pendingAmount)
        : packageAmount - paidAmount,
    icsiD1: toNullableDate(body.icsiD1),
    opu: toNullableDate(body.opu),
    fetD1: toNullableDate(body.fetD1),
    fet: toNullableDate(body.fet),
    numberOfEmbryos,
    numberOfEmbryosUsed,
    numberOfEmbryosDiscarded: toNumberOrZero(body.numberOfEmbryosDiscarded),
    lastRenewalDate: toNullableDate(body.lastRenewalDate),
    embryosRemaining:
      body.embryosRemaining !== undefined && body.embryosRemaining !== null
        ? toNumberOrZero(body.embryosRemaining)
        : numberOfEmbryos - numberOfEmbryosUsed,
    uptResult: body.uptResult || null,
    uptManualEntry: body.uptManualEntry || null,
    updatedBy: userId || null
  };

  if (isCreate) {
    payload.createdBy = userId || null;
  }

  return payload;
};

class PatientTrackerService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
  }

  async getAllPatientTrackerService() {
    const { fromDate, toDate, branchId, patientId } = this._request.query || {};

    const where = {};
    if (fromDate && toDate) {
      where.date = { [Op.between]: [fromDate, toDate] };
    } else if (fromDate) {
      where.date = { [Op.gte]: fromDate };
    } else if (toDate) {
      where.date = { [Op.lte]: toDate };
    }
    if (branchId && branchId !== "ALL") {
      where.branchId = Number(branchId);
    }
    if (patientId) {
      where.patientId = patientId;
    }

    const data = await PatientTrackerModel.findAll({
      where,
      order: [["date", "DESC"], ["updatedAt", "DESC"]],
      raw: true
    }).catch(err => {
      console.log("Error while fetching patient tracker records", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return data;
  }

  async getByPatientIdService() {
    const { patientId } = this._request.params;
    if (!patientId) {
      throw new createError.BadRequest("Patient ID is required");
    }

    const record = await PatientTrackerModel.findOne({
      where: { patientId },
      order: [["updatedAt", "DESC"], ["id", "DESC"]],
      raw: true
    }).catch(err => {
      console.log("Error while fetching patient tracker by patientId", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return record || null;
  }

  async createPatientTrackerService() {
    const body = { ...this._request.body };
    if (body.treatmentType) {
      body.treatmentType = normalizeTreatmentType(body.treatmentType);
    }

    const validated = await createPatientTrackerSchema.validateAsync(body);
    const userId = this._request?.userDetails?.id;
    const payload = buildPayload(validated, userId, true);

    const created = await PatientTrackerModel.create(payload).catch(err => {
      console.log("Error while creating patient tracker record", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return created;
  }

  async editPatientTrackerService() {
    const body = { ...this._request.body };
    if (body.treatmentType) {
      body.treatmentType = normalizeTreatmentType(body.treatmentType);
    }

    const validated = await editPatientTrackerSchema.validateAsync(body);
    const existing = await PatientTrackerModel.findOne({
      where: { id: validated.id }
    }).catch(err => {
      console.log("Error while finding patient tracker record", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(existing)) {
      throw new createError.NotFound("Patient tracker record not found");
    }

    const userId = this._request?.userDetails?.id;
    const payload = buildPayload(validated, userId, false);

    await existing.update(payload).catch(err => {
      console.log("Error while updating patient tracker record", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return existing;
  }
}

module.exports = PatientTrackerService;
