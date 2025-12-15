const Constants = require("../constants/constants");
const createError = require("http-errors");
const lodash = require("lodash");
const {
  addNewPaymentSchema,
  getOrderIdSchema,
  sendTransactionIdSchema
} = require("../schemas/otherPaymentsSchema");
const PatientOtherPaymentsAssociationModel = require("../models/Associations/patientOtherPaymentsAssociation");
const {
  otherPaymentInfoByPatientId,
  otherPaymentInvoiceDetails,
  patientHeaderForInvoiceQuery,
  purchaseInformationForProductTable
} = require("../queries/other_payments_queries");
const MySqlConnection = require("../connections/mysql_connection");
const { Sequelize } = require("sequelize");
const OtherPaymentsOrderMaster = require("../models/Master/otherPaymentsOrderMaster");
const moment = require("moment");
const RazorpayConnection = require("../connections/razarpay_connection");
const { v4: uuidv4 } = require("uuid");
const BaseService = require("./baseService");
const GenerateHtmlTemplate = require("../utils/templateUtils");
let { patientHeaderForInvoice } = require("../templates/headerTemplates");
var converter = require("number-to-words");
let { invoiceTemplate } = require("../templates/invoiceTemplate");

class OtherPaymentsService extends BaseService {
  constructor(request, response, next) {
    super(request, response, next);
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.razorpay = RazorpayConnection.getRazorpay();
    this.htmlTemplateGenerationObj = new GenerateHtmlTemplate();
  }

  async addNewPaymentService() {
    const validatedPayload = await addNewPaymentSchema.validateAsync(
      this._request.body
    );

    await PatientOtherPaymentsAssociationModel.create({
      patientId: validatedPayload?.patientId,
      appointmentReason: validatedPayload?.appointmentReason,
      amount: validatedPayload?.amount,
      createdBy: this._request.userDetails?.id
    }).catch(err => {
      console.log("Error while adding other payment", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }

  async getOtherPaymentsStatusService() {
    const { patientId } = this._request.params;

    if (!patientId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Patient Id")
      );
    }

    const data = await this.mysqlConnection
      .query(otherPaymentInfoByPatientId, {
        replacements: {
          patientId: patientId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching the payment info details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async getBranchIdByOtherPaymentsRefId(refId) {
    try {
      let branchId = null,
        branchCode = null;
      const result = await this.mysqlConnection.query(
        `SELECT pm.branchId, bm.branchCode
          FROM patient_master pm
          INNER JOIN patient_other_payment_associations popa ON popa.patientId = pm.id
          INNER JOIN branch_master bm ON bm.id = pm.branchId
          WHERE popa.id = :refId
          LIMIT 1;`,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { refId: refId }
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
    try {
      const validOrderData = await getOrderIdSchema.validateAsync(
        this._request.body
      );
      const {
        totalOrderAmount,
        payableAmount,
        discountAmount,
        payableAfterDiscountAmount,
        pendingOrderAmount,
        couponCode,
        paymentMode,
        refId
      } = validOrderData;

      const calculatedPayableAmount = totalOrderAmount - pendingOrderAmount;
      if (calculatedPayableAmount.toString() != payableAmount) {
        throw new createError.BadRequest(Constants.PAYABLE_AMOUNT_WRONG);
      }
      const caluclatedPayableAfterDiscountAmount =
        payableAmount - discountAmount;
      if (
        caluclatedPayableAfterDiscountAmount.toString() !=
        payableAfterDiscountAmount
      ) {
        throw new createError.BadRequest(
          Constants.PAYABLE_AMOUNT_AFTER_DISCOUNT_WRONG
        );
      }

      let orderId;

      if (paymentMode === "ONLINE") {
        const {
          branchId,
          branchCode
        } = await this.getBranchIdByOtherPaymentsRefId(refId);
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
          amount: payableAfterDiscountAmount * 100,
          currency: "INR",
          receipt: uuidv4(),
          payment_capture: 1,
          notes: { branch: branchCode },
          transfers: [
            {
              account: accountId,
              amount: payableAfterDiscountAmount * 100,
              currency: "INR",
              notes: { purpose: "Order routed to sub-account" }
            }
          ]
        });
        orderId = razorpayOrder.id;
      } else {
        orderId = moment.tz("Asia/Kolkata").format("YYYYMMDDHHmmssSS");
      }

      const orderData = {
        orderId,
        paymentMode,
        pendingOrderAmount: pendingOrderAmount,
        paidOrderAmountBeforeDiscount: payableAmount,
        paidOrderAmount: payableAfterDiscountAmount,
        totalOrderAmount,
        discountAmount,
        couponCode,
        orderDate: moment()
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
        paymentStatus:
          paymentMode === "CASH" || paymentMode === "UPI" ? "PAID" : "DUE",
        refId
      };

      const orderDetailsResponse = await OtherPaymentsOrderMaster.create(
        orderData
      );

      if (paymentMode != "ONLINE") {
        const orderDataUpdated = {
          ...orderDetailsResponse.dataValues,
          paymentStatus: "PAID"
        };

        await OtherPaymentsOrderMaster.update(orderDataUpdated, {
          where: { orderId }
        });
      }

      return orderDetailsResponse;
    } catch (err) {
      console.error("Error while adding order details:", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async sendTransactionIdService() {
    const validTransactionData = await sendTransactionIdSchema.validateAsync(
      this._request.body
    );
    const { orderId, transactionId, transactionType } = validTransactionData;

    const existedOrderDetails = await OtherPaymentsOrderMaster.findOne({
      where: { orderId }
    });

    if (!existedOrderDetails) {
      throw new createError.NotFound(Constants.ORDER_DETAILS_DOES_NOT_EXIST);
    }

    const orderDataUpdated = {
      ...existedOrderDetails.dataValues,
      transactionId,
      transactionType,
      paymentStatus: "PAID"
    };

    await OtherPaymentsOrderMaster.update(orderDataUpdated, {
      where: { orderId }
    });

    return Constants.PAYMENT_SUCCESSFUL;
  }

  async generateProductTableForInvoice(orderNo) {
    const purchaseDetails = await this.mysqlConnection
      .query(purchaseInformationForProductTable, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          orderNo: orderNo
        }
      })
      .catch(err => {
        console.log("Error while fetching order details of other payment", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(purchaseDetails)) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    return purchaseDetails.map((item, index) => ({
      serialNumber: index + 1,
      ...item
    }));
  }

  async generatePatientHeaderInformationForInvoice(orderDetails, patientId) {
    const data = await this.mysqlConnection
      .query(patientHeaderForInvoiceQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          patientId: patientId
        }
      })
      .catch(err => {
        console.log("Error while fetching patient details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    let patientHeaderInforForInvoice = patientHeaderForInvoice;
    patientHeaderInforForInvoice = patientHeaderInforForInvoice
      .replaceAll("{{orderNo}}", orderDetails?.orderNo)
      .replaceAll("{{orderDate}}", orderDetails?.orderDate)
      .replaceAll("{{patientId}}", data[0]?.patientInformation?.patientId)
      .replaceAll("{{name}}", data[0]?.patientInformation?.name)
      .replaceAll("{{doctorName}}", data[0]?.patientInformation?.doctorName)
      .replaceAll("{{ageGender}}", data[0]?.patientInformation?.ageGender)
      .replaceAll("{{mobileNumber}}", data[0]?.patientInformation?.mobileNumber)
      .replaceAll("{{paymentMode}}", orderDetails?.paymentMode);

    return patientHeaderInforForInvoice;
  }

  async downloadInvoiceService() {
    const { refId, patientId } = this._request.query;

    if (!refId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{{params}}", "Reference Id")
      );
    }

    if (!patientId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{{params}}", "Patient Id")
      );
    }

    const hospitalLogoHeaderTemplate = await this.hospitalLogoHeaderTemplateUsingPatientId(
      patientId
    );

    let invoiceTemplates = [];

    const invoiceDetailsList = await this.mysqlConnection
      .query(otherPaymentInvoiceDetails, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          refId: refId
        }
      })
      .catch(err => {
        console.log(
          "Error while fetching the invoice Data of other payments",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(invoiceDetailsList)) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    for (const invoiceDetails of invoiceDetailsList) {
      const { paidAmount } = { ...invoiceDetails?.paymentBreakUp }; // Converstion into words
      let patientOrderAndPaymentInfo = {
        ...invoiceDetails?.orderDetails,
        ...invoiceDetails?.paymentBreakUp,
        amountInWords:
          lodash.startCase(converter.toWords(+paidAmount)) + " Rupees",
        currentDate: invoiceDetails?.currentDate,
        hospitalLogoInformation: hospitalLogoHeaderTemplate,
        Currency: "Rs",
        isPharmacy: 0,
        isScan: 0,
        isLab: 0,
        isEmbryology: 0,
        isConsultationFee: 0,
        isAppointment: 0,
        isMileStone: 0,
        isAdvancePayment: 1 // For Showing Advance payment Section in Invoice Template
      };

      let productTableData;

      productTableData = await this.generateProductTableForInvoice(
        invoiceDetails?.orderDetails?.orderNo
      );

      const patientHeaderForInvoice = await this.generatePatientHeaderInformationForInvoice(
        invoiceDetails?.orderDetails,
        patientId
      );

      const invoiceGenerationData = {
        ...patientOrderAndPaymentInfo,
        productTable: productTableData,
        patientHeaderInformation: patientHeaderForInvoice
      };

      const htmlContent = await this.htmlTemplateGenerationObj.generateTemplateFromText(
        invoiceTemplate,
        invoiceGenerationData
      );

      invoiceTemplates.push(htmlContent);
    }

    let finalTemplate = `<html>
        <head>
          <title>Origins Invoice</title>
        </head>
        <body style="margin: 0; padding: 0;">
          <div style="display: flex;flex-direction: column; justify-content: center; align-items: center;">  
            ${invoiceTemplates.join("")}
          </div>
        </body>
      </html>
    `;

    return finalTemplate;
  }
}

module.exports = OtherPaymentsService;
