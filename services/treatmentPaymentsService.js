const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const RazorpayConnection = require("../connections/razarpay_connection");
const {
  getTreatmentOrderIdSchema,
  sendTransactionSchema,
  packageDetailsSchema
} = require("../schemas/treatmentsPaymentSchema");
const lodash = require("lodash");
const Constants = require("../constants/constants");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment-timezone");
const TreatmentOrdersMasterModel = require("../models/Order/treatmentOrdersMaster");
const VisitPackagesAssociation = require("../models/Associations/visitPackagesAssociation");
const TreatmentAppointmentAssociations = require("../models/Associations/treatmentAppointmentAssociations");
const {
  updatePreviousTotalAmountsQuery
} = require("../queries/treatmentPayments_queries");
const { QueryTypes, Sequelize } = require("sequelize");

class TreatmentPaymentsService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.razorpay = RazorpayConnection.getRazorpay();
  }

  async savePackageDetails(payload, t) {
    const packageDetails = await packageDetailsSchema.validateAsync(payload);
    const { visitId } = packageDetails;
    delete packageDetails.visitId;
    await VisitPackagesAssociation.update(
      {
        ...packageDetails
      },
      {
        where: {
          visitId: visitId
        },
        transaction: t
      }
    ).catch(err => {
      console.log("Error while updating the package details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async disablePreviousPendingOrderAmounts(payload, t) {
    /*
      DELETE PREVIOUS pending amount so that total Amount is Accumulated
    */
    const { visitId } = payload;

    await this.mysqlConnection
      .query(updatePreviousTotalAmountsQuery, {
        type: QueryTypes.UPDATE,
        replacements: {
          visitId: visitId
        },
        transaction: t
      })
      .catch(err => {
        console.log("Error while updating the previous total amounts", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async sendTransactionService() {
    const sendTransactionPayload = await sendTransactionSchema.validateAsync(
      this._request.body
    );

    const {
      orderId,
      transactionId,
      isPackageExists,
      dateColumns,
      visitId
    } = sendTransactionPayload;

    await this.mysqlConnection.transaction(async t => {
      await TreatmentOrdersMasterModel.update(
        {
          paymentStatus: "PAID",
          transactionId
        },
        {
          where: {
            orderId: orderId
          },
          transaction: t
        }
      ).catch(err => {
        console.log("Error while updating the transaction details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (!lodash.isEmpty(this._request.body.packageDetails)) {
        await this.savePackageDetails(this._request.body?.packageDetails, t);
      }

      // For non package we dont have package table
      if (isPackageExists == 1) {
        //Handle milestone Start dates if not started
        await VisitPackagesAssociation.update(
          { ...dateColumns },
          {
            where: {
              visitId: visitId
            },
            transaction: t
          }
        ).catch(err => {
          console.log("Error while updating the date columns", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      }
    });

    return Constants.PAYMENT_SUCCESSFUL;
  }

  async getBranchIdByVisitId(visitId) {
    try {
      let branchId = null,
        branchCode = null;
      const result = await this.mysqlConnection.query(
        `Select pm.branchId , bm.branchCode from patient_master pm 
          INNER JOIN patient_visits_association pva ON pva.patientId = pm.id
          INNER JOIN branch_master bm ON bm.id = pm.branchId
          where pva.id = :visitId
          LIMIT 1`,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { visitId }
        }
      );
      if (result && result.length > 0) {
        branchId = result[0].branchId;
        branchCode = result[0].branchCode;
      }
      if (!branchId || !branchCode) {
        throw new createError.NotFound(Constants.BRANCH_NOT_FOUND);
      }
      return { branchId, branchCode };
    } catch (err) {
      console.error("Error while fetching branchId:", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async getOrderIdService() {
    const getOrderIdPayload = await getTreatmentOrderIdSchema.validateAsync(
      this._request.body
    );
    let {
      orderDetails,
      isPackageExists,
      packageDetails,
      paymentMode,
      visitId
    } = getOrderIdPayload;

    let totalPayableAfterDiscountAmount = 0;
    // Validation for the Each Item : Discount, payableAmount is correct or not
    for (const currentOrder of orderDetails) {
      const {
        totalOrderAmount,
        payableAmount,
        discountAmount,
        payableAfterDiscountAmount,
        pendingOrderAmount
      } = currentOrder;

      const calculatedPayableAmount = totalOrderAmount - pendingOrderAmount;
      if (calculatedPayableAmount.toString() !== payableAmount) {
        throw new createError.BadRequest(Constants.PAYABLE_AMOUNT_WRONG);
      }
      const caluclatedPayableAfterDiscountAmount =
        payableAmount - discountAmount;
      if (
        caluclatedPayableAfterDiscountAmount.toString() !==
        payableAfterDiscountAmount
      ) {
        throw new createError.BadRequest(
          Constants.PAYABLE_AMOUNT_AFTER_DISCOUNT_WRONG
        );
      }

      // Grand Total of All Items
      totalPayableAfterDiscountAmount += +payableAfterDiscountAmount;
    }

    // Generating razorpayId
    let orderId = null;
    if (paymentMode === "ONLINE") {
      const { branchId, branchCode } = await this.getBranchIdByVisitId(visitId);
      if (!branchId) {
        throw new createError.NotFound(Constants.BRANCH_NOT_FOUND);
      }
      console.log("Branch ID:", branchId);
      console.log("Branch Code:", branchCode);
      let accountId = null;
      if (branchId === 2) {
        // HNK Frontdesk
        accountId = "acc_QvFxqAwkJA1KCX";
      } else if (branchId === 1 || branchId === 3 || branchId === 4) {
        accountId = "acc_QjXMw2peC4keGS";
      } else {
        throw new createError.NotFound(Constants.BRANCH_NOT_FOUND);
      }
      console.log("Account ID:", accountId);
      if (!accountId) {
        throw new createError.NotFound(Constants.ACCOUNT_NOT_FOUND);
      }

      const razorpayOrder = await this.razorpay.orders.create({
        amount: totalPayableAfterDiscountAmount * 100, // Sum of all items
        currency: "INR",
        receipt: uuidv4(),
        payment_capture: 1,
        notes: { branch: branchCode },
        transfers: [
          {
            account: accountId,
            amount: totalPayableAfterDiscountAmount * 100,
            currency: "INR",
            notes: { purpose: "Order routed to sub-account" }
          }
        ]
      });
      orderId = razorpayOrder.id;
    } else {
      orderId = moment.tz("Asia/Kolkata").format("YYYYMMDDHHmmssSS");
    }

    const ordersDataForInsertion = orderDetails.map(currentOrder => ({
      orderId,
      paymentMode,
      pendingOrderAmount: currentOrder?.pendingOrderAmount,
      totalOrderAmount: currentOrder?.totalOrderAmount,
      paidOrderAmountBeforeDiscount: +currentOrder?.payableAmount,
      couponCode: currentOrder?.couponCode,
      discountAmount: currentOrder?.discountAmount,
      paidOrderAmount: +currentOrder?.payableAfterDiscountAmount,
      productType: currentOrder?.productType,
      paymentStatus: paymentMode == "ONLINE" ? "DUE" : "PAID",
      orderDate: moment()
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss"),
      visitId,
      comments: currentOrder?.comments,
      dueDate: currentOrder?.dueDate
    }));

    // Updating milestone start dates
    const dateColumns = {};
    if (isPackageExists == 1) {
      const updateInfo = [];
      for (const order of orderDetails) {
        updateInfo.push({
          dateColumn: order?.dateColumn,
          startedDate: order?.mileStoneStartedDate
        });
      }
      for (const info of updateInfo) {
        if (info?.startedDate == "NA") {
          // Only process if date does not exists else keep same date only
          dateColumns[(info?.dateColumn)] = moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD");
        }
      }
    }

    await this.mysqlConnection.transaction(async t => {
      await TreatmentOrdersMasterModel.bulkCreate(ordersDataForInsertion, {
        transaction: t
      }).catch(err => {
        console.log("Error while saving the order details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      // If CASH MODE do it here only or else update in ONLINE MODE
      if (
        isPackageExists == 1 &&
        (paymentMode == "CASH" || paymentMode == "UPI")
      ) {
        //Handle milestone Start dates if not started
        await VisitPackagesAssociation.update(
          { ...dateColumns },
          {
            where: {
              visitId: visitId
            },
            transaction: t
          }
        ).catch(err => {
          console.log("Error while updating the date columns", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      }

      if (paymentMode == "CASH" || paymentMode == "UPI") {
        if (!lodash.isEmpty(packageDetails)) {
          await this.savePackageDetails(packageDetails, t);
        }
      }
    });

    return {
      orderId: orderId,
      visitId: visitId,
      packageDetails: packageDetails,
      totalOrderAmount: totalPayableAfterDiscountAmount,
      isPackageExists: isPackageExists,
      dateColumns: dateColumns
    };
  }
}

module.exports = TreatmentPaymentsService;
