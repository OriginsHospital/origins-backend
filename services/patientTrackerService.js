const Constants = require("../constants/constants");
const createError = require("http-errors");
const { Op, Sequelize } = require("sequelize");
const lodash = require("lodash");
const MySqlConnection = require("../connections/mysql_connection");
const PatientTrackerModel = require("../models/Master/patientTrackerMaster");
const {
  createPatientTrackerSchema,
  editPatientTrackerSchema,
  upsertEmbryologyUptSchema
} = require("../schemas/patientTrackerSchema");
const {
  getPatientTrackerSummaryAutomatedQuery
} = require("../queries/patient_tracker_queries");

const BRANCH_CODE_TO_ID = {
  HYD: 1,
  HNK: 2,
  SPL: 3,
  KMM: 4
};

const resolveBranchId = value => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "ALL"
  ) {
    return null;
  }
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && asNumber > 0) {
    return asNumber;
  }
  const code = String(value)
    .trim()
    .toUpperCase();
  return BRANCH_CODE_TO_ID[code] || null;
};

const parseJsonField = value => {
  if (value == null) return value;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (err) {
      return value;
    }
  }
  return value;
};

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
    this.mysqlConnection = MySqlConnection._instance;
  }

  /**
   * Fast Summary Automated feed: date-filtered patients + package amounts
   * in a single SQL round-trip (no per-patient visit/package fan-out).
   */
  async getSummaryAutomatedService() {
    const { fromDate, toDate, branchId, branch } = this._request.query || {};

    if (!fromDate || !toDate) {
      throw new createError.BadRequest("fromDate and toDate are required");
    }

    const resolvedBranchId = resolveBranchId(branchId ?? branch);
    const branchFilter = resolvedBranchId ? "AND pm.branchId = :branchId" : "";

    const query = getPatientTrackerSummaryAutomatedQuery.replace(
      "{branchFilter}",
      branchFilter
    );

    const replacements = {
      fromDate,
      toDate
    };
    if (resolvedBranchId) {
      replacements.branchId = resolvedBranchId;
    }

    const rows = await this.mysqlConnection
      .query(query, {
        replacements,
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log(
          "Error while fetching patient tracker summary automated",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return (rows || []).map(row => {
      const doctorSuggestedPackage = Number(row.doctorSuggestedPackage) || 0;
      const marketingPackage = Number(row.marketingPackage) || 0;
      const registrationAmount = Number(row.registrationAmount) || 0;
      const paidAmount = Number(row.paidAmount) || 0;
      const pendingAmount =
        row.pendingAmount != null
          ? Number(row.pendingAmount) || 0
          : Math.max(0, marketingPackage - paidAmount);

      const formatDisplayDate = value => {
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          value === "-"
        ) {
          return "-";
        }
        // Already formatted DD-MM-YYYY
        if (/^\d{2}-\d{2}-\d{4}$/.test(String(value))) return String(value);
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return String(value);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
      };

      const icsiD1 = formatDisplayDate(row.icsiD1);
      const opu = formatDisplayDate(row.opu);
      const fetD1 = formatDisplayDate(row.fetD1);
      const fet = formatDisplayDate(row.fet);
      const lastRenewalDate = row.lastRenewalDate
        ? formatDisplayDate(row.lastRenewalDate)
        : null;

      return {
        ...row,
        referralSource: parseJsonField(row.referralSource),
        activeVisitId: row.activeVisitId || null,
        doctorSuggestedPackage,
        doctorsPackage: doctorSuggestedPackage,
        marketingPackage,
        registrationAmount,
        paidAmount,
        pendingAmount,
        icsiD1,
        opu,
        fetD1,
        fet,
        uptResult: row.uptResult || "-",
        uptManualEntry: row.uptManualEntry || null,
        numberOfEmbryos: Number(row.numberOfEmbryos) || 0,
        numberOfEmbryosUsed: Number(row.numberOfEmbryosUsed) || 0,
        numberOfEmbryosDiscarded: Number(row.numberOfEmbryosDiscarded) || 0,
        embryosRemaining: Number(row.embryosRemaining) || 0,
        lastRenewalDate,
        // Prefer manually tracked cycle status when present
        cycleStatus: row.trackerCycleStatus || null,
        stageOfCycle: row.trackerStageOfCycle || row.stageOfCycle || "-"
      };
    });
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

  /**
   * Embryology dept data entry: update embryo/UPT on existing tracker,
   * or create a minimal tracker row when none exists for the patient.
   */
  async upsertEmbryologyUptService() {
    const body = { ...this._request.body };
    if (body.treatmentType) {
      body.treatmentType = normalizeTreatmentType(body.treatmentType);
    }
    // Coerce types that often arrive wrong from the UI
    if (body.mobileNumber != null && body.mobileNumber !== "") {
      body.mobileNumber = String(body.mobileNumber).slice(0, 15);
    }
    if (body.branchId != null && body.branchId !== "") {
      body.branchId = Number(body.branchId);
    }

    const validated = await upsertEmbryologyUptSchema.validateAsync(body);
    const userId = this._request?.userDetails?.id || null;

    const numberOfEmbryos = toNumberOrZero(validated.numberOfEmbryos);
    const numberOfEmbryosUsed = toNumberOrZero(validated.numberOfEmbryosUsed);
    const numberOfEmbryosDiscarded = toNumberOrZero(
      validated.numberOfEmbryosDiscarded
    );
    const embryosRemaining =
      validated.embryosRemaining !== undefined &&
      validated.embryosRemaining !== null
        ? toNumberOrZero(validated.embryosRemaining)
        : Math.max(0, numberOfEmbryos - numberOfEmbryosUsed);

    const embryologyFields = {
      numberOfEmbryos,
      numberOfEmbryosUsed,
      numberOfEmbryosDiscarded,
      embryosRemaining,
      lastRenewalDate: toNullableDate(validated.lastRenewalDate),
      uptResult: validated.uptResult || null,
      uptManualEntry:
        validated.uptResult === "Others"
          ? validated.uptManualEntry || null
          : null,
      updatedBy: userId
    };

    let existing = null;
    try {
      existing = await PatientTrackerModel.findOne({
        where: { patientId: validated.patientId },
        order: [["updatedAt", "DESC"], ["id", "DESC"]]
      });
    } catch (err) {
      console.log("Error while finding tracker for embryology upsert", err);
      throw new createError.InternalServerError(
        err?.original?.message ||
          err?.message ||
          Constants.SOMETHING_ERROR_OCCURRED
      );
    }

    if (existing) {
      try {
        await existing.update(embryologyFields);
        return existing;
      } catch (err) {
        console.log("Error while updating embryology/UPT fields", err);
        throw new createError.InternalServerError(
          err?.original?.message ||
            err?.message ||
            Constants.SOMETHING_ERROR_OCCURRED
        );
      }
    }

    if (!validated.patientName || !validated.branchId) {
      throw new createError.BadRequest(
        "patientName and branchId are required to create a new tracker entry"
      );
    }

    const treatmentType =
      normalizeTreatmentType(validated.treatmentType) || "IVF";
    const cycleStatus = validated.cycleStatus || "Running";

    // Lean create payload — avoid clinical columns that may not exist on older DBs
    const createPayload = {
      date: toNullableDate(validated.date) || new Date(),
      branchId: Number(validated.branchId),
      patientId: validated.patientId,
      patientName: String(validated.patientName).slice(0, 255),
      mobileNumber: validated.mobileNumber
        ? String(validated.mobileNumber).slice(0, 15)
        : null,
      plan: validated.plan ? String(validated.plan).slice(0, 255) : null,
      treatmentType,
      cycleStatus,
      numberOfEmbryos,
      numberOfEmbryosUsed,
      numberOfEmbryosDiscarded,
      embryosRemaining,
      lastRenewalDate: toNullableDate(validated.lastRenewalDate),
      uptResult: validated.uptResult || null,
      uptManualEntry:
        validated.uptResult === "Others"
          ? validated.uptManualEntry || null
          : null,
      packageAmount: 0,
      registrationAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      createdBy: userId,
      updatedBy: userId
    };

    try {
      const fields = Object.keys(createPayload);
      const created = await PatientTrackerModel.create(createPayload, {
        fields
      });
      return created;
    } catch (err) {
      console.log("Error while creating tracker from embryology entry", {
        message: err?.message,
        original: err?.original?.message,
        sql: err?.sql,
        payload: createPayload
      });
      const dbMessage = err?.original?.message || err?.message || "";
      if (/Unknown column/i.test(dbMessage)) {
        throw new createError.InternalServerError(
          "Patient tracker table is missing columns. Please run patient_tracker migrations."
        );
      }
      if (/foreign key|Cannot add or update/i.test(dbMessage)) {
        throw new createError.BadRequest(
          "Invalid branch or user reference. Please reselect the patient and try again."
        );
      }
      if (/doesn't exist|ER_NO_SUCH_TABLE/i.test(dbMessage)) {
        throw new createError.InternalServerError(
          "patient_tracker table does not exist. Please run create_patient_tracker_table_simple.sql"
        );
      }
      throw new createError.InternalServerError(
        dbMessage || Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }
}

module.exports = PatientTrackerService;
