const createError = require("http-errors");
const Constants = require("../constants/constants");
const MySqlConnection = require("../connections/mysql_connection");
const OrderDetailsMasterModel = require("../models/Master/OrderDetailsMasterModel");
const TreatmentOrdersMaster = require("../models/Order/treatmentOrdersMaster");
const OtherPaymentsOrderMaster = require("../models/Master/otherPaymentsOrderMaster");

const ALLOWED_SOURCES = new Set([
  "ORDER_DETAILS",
  "TREATMENT_ORDER",
  "OTHER_PAYMENT"
]);

function assertRevenueNewEntryEditor(request) {
  const email = (request.userDetails?.email || "").trim().toLowerCase();
  if (email !== Constants.ADVANCE_PAYMENT_HISTORY_EDITOR_EMAIL.toLowerCase()) {
    throw new createError.Forbidden(Constants.REVENUE_NEW_ENTRY_EDIT_FORBIDDEN);
  }
}

function parseMasterId(params) {
  const id = parseInt(String(params.paymentMasterId), 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new createError.BadRequest("Invalid payment id");
  }
  return id;
}

function normalizeSource(params) {
  const source = String(params.source || "").toUpperCase();
  if (!ALLOWED_SOURCES.has(source)) {
    throw new createError.BadRequest("Invalid revenue entry type");
  }
  return source;
}

class RevenueNewEntryService {
  constructor(request) {
    this._request = request;
    this.mysqlConnection = MySqlConnection._instance;
  }

  async updateEntry() {
    assertRevenueNewEntryEditor(this._request);
    const source = normalizeSource(this._request.params);
    const id = parseMasterId(this._request.params);
    const {
      totalOrderAmount,
      discountAmount,
      paidOrderAmount,
      paymentMode,
      productType,
      orderDate,
      appointmentReason
    } = this._request.body || {};

    if (source === "ORDER_DETAILS") {
      const row = await OrderDetailsMasterModel.findByPk(id);
      if (!row) throw new createError.NotFound("Payment record not found");
      const updateData = {};
      if (totalOrderAmount !== undefined)
        updateData.totalOrderAmount = totalOrderAmount;
      if (discountAmount !== undefined)
        updateData.discountAmount = discountAmount;
      if (paidOrderAmount !== undefined)
        updateData.paidOrderAmount = paidOrderAmount;
      if (paymentMode !== undefined) updateData.paymentMode = paymentMode;
      if (productType !== undefined) updateData.productType = productType;
      if (orderDate !== undefined) updateData.orderDate = orderDate;
      await row.update(updateData).catch(err => {
        console.log("revenueNewEntry update order_details_master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
      return row;
    }

    if (source === "TREATMENT_ORDER") {
      const row = await TreatmentOrdersMaster.findByPk(id);
      if (!row) throw new createError.NotFound("Payment record not found");
      const updateData = {};
      if (totalOrderAmount !== undefined)
        updateData.totalOrderAmount = totalOrderAmount;
      if (discountAmount !== undefined)
        updateData.discountAmount = String(discountAmount);
      if (paidOrderAmount !== undefined)
        updateData.paidOrderAmount = String(paidOrderAmount);
      if (paymentMode !== undefined) updateData.paymentMode = paymentMode;
      if (productType !== undefined) updateData.productType = productType;
      if (orderDate !== undefined) updateData.orderDate = orderDate;
      await row.update(updateData).catch(err => {
        console.log("revenueNewEntry update treatment_orders_master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
      return row;
    }

    const paymentHistory = await OtherPaymentsOrderMaster.findByPk(id);
    if (!paymentHistory)
      throw new createError.NotFound("Payment record not found");

    const updateData = {};
    const currentPaidAmount = paymentHistory.paidOrderAmount
      ? parseFloat(paymentHistory.paidOrderAmount)
      : 0;
    const currentDiscount = paymentHistory.discountAmount
      ? parseFloat(paymentHistory.discountAmount)
      : 0;
    const finalPaidAmount =
      paidOrderAmount !== undefined
        ? parseFloat(paidOrderAmount)
        : currentPaidAmount;
    const finalDiscountAmount =
      discountAmount !== undefined
        ? parseFloat(discountAmount)
        : currentDiscount;
    const finalPaidBeforeDiscount = finalPaidAmount + finalDiscountAmount;
    if (
      paidOrderAmount !== undefined ||
      discountAmount !== undefined ||
      totalOrderAmount !== undefined
    ) {
      updateData.paidOrderAmount = finalPaidAmount.toString();
      updateData.paidOrderAmountBeforeDiscount = finalPaidBeforeDiscount.toString();
      updateData.discountAmount = finalDiscountAmount.toString();
    }
    if (totalOrderAmount !== undefined)
      updateData.totalOrderAmount = totalOrderAmount;
    if (paymentMode !== undefined) updateData.paymentMode = paymentMode;
    if (orderDate !== undefined) updateData.orderDate = orderDate;
    updateData.updatedBy = this._request.userDetails?.id;
    updateData.updatedAt = new Date();

    await paymentHistory.update(updateData).catch(err => {
      console.log("revenueNewEntry update other_payment_orders_master", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    const updatedRecord = await OtherPaymentsOrderMaster.findByPk(id);

    if (appointmentReason !== undefined && appointmentReason !== null) {
      const trimmed = String(appointmentReason).trim();
      if (!trimmed) {
        throw new createError.BadRequest("Payment title cannot be empty");
      }
      if (trimmed.length > 100) {
        throw new createError.BadRequest(
          "Payment title must be at most 100 characters"
        );
      }
      const refIdRaw =
        updatedRecord?.get?.("refId") ??
        updatedRecord?.refId ??
        paymentHistory?.get?.("refId") ??
        paymentHistory?.refId;
      const refId =
        refIdRaw !== undefined && refIdRaw !== null
          ? parseInt(String(refIdRaw), 10)
          : NaN;
      if (!Number.isFinite(refId) || refId <= 0) {
        throw new createError.InternalServerError(
          "Could not resolve advance payment entry for title update"
        );
      }
      const userId = this._request.userDetails?.id ?? null;
      await this.mysqlConnection
        .query(
          `UPDATE patient_other_payment_associations
           SET appointmentReason = :title,
               updatedBy = :userId,
               updatedAt = NOW()
           WHERE id = :refId`,
          {
            replacements: { title: trimmed, userId, refId }
          }
        )
        .catch(err => {
          console.log("revenueNewEntry appointmentReason update", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    }

    return updatedRecord;
  }

  async deleteEntry() {
    assertRevenueNewEntryEditor(this._request);
    const source = normalizeSource(this._request.params);
    const id = parseMasterId(this._request.params);

    if (source === "ORDER_DETAILS") {
      const row = await OrderDetailsMasterModel.findByPk(id);
      if (!row) throw new createError.NotFound("Payment record not found");
      await row.destroy().catch(err => {
        console.log("revenueNewEntry delete order_details_master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
      return { message: "Payment record deleted successfully" };
    }

    if (source === "TREATMENT_ORDER") {
      const row = await TreatmentOrdersMaster.findByPk(id);
      if (!row) throw new createError.NotFound("Payment record not found");
      await row.destroy().catch(err => {
        console.log("revenueNewEntry delete treatment_orders_master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
      return { message: "Payment record deleted successfully" };
    }

    const row = await OtherPaymentsOrderMaster.findByPk(id);
    if (!row) throw new createError.NotFound("Payment record not found");
    await row.destroy().catch(err => {
      console.log("revenueNewEntry delete other_payment_orders_master", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return { message: "Payment record deleted successfully" };
  }
}

module.exports = RevenueNewEntryService;
