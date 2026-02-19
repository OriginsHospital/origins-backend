const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const StockMySqlConnection = require("../connections/stock_mysql_connection");
const Constants = require("../constants/constants");
const { Sequelize } = require("sequelize");
const lodash = require("lodash");
var converter = require("number-to-words");
const { v4: uuidv4 } = require("uuid");
const {
  orderDetailsSchema,
  transactionDetailsSchema,
  invoiceSchema,
  returnPharmacyItemSchema,
  returnSchema
} = require("../schemas/paymentSchemas");
const OrderDetailsMasterModel = require("../models/Master/OrderDetailsMasterModel");
const TreatmentOrdersMasterModel = require("../models/Order/treatmentOrdersMaster");
const moment = require("moment-timezone");
const RazorpayConnection = require("../connections/razarpay_connection");
const treatmentAppointmentLineBillsAssociations = require("../models/Associations/treatmentAppointmentLineBillsAssociations");
const consultationAppointmentLineBillsAssociations = require("../models/Associations/consultationAppointmentLineBillsAssociations");
const PharmacyPurchaseDetailsTemp = require("../models/Order/pharmacyPurchaseDetailsTemp");
const GrnItemsAssociationsModel = require("../models/Associations/grnItemsAssociations");
const {
  invoiceForConsultationAppointmentsQuery,
  invoiceForTreatementAppointmentsQuery,
  pharmacyConsultationProductTable,
  pharmacyTreatmentProductTable,
  patientItemReturnConsultationQuery,
  patientItemReturnTreatementQuery,
  getConsultationFormFPatientDetails,
  getTreatmentFormFPatientDetails,
  invoiceForTreatmentOrdersMileStoneQuery,
  getAppointmentReasonForInvoiceQuery,
  consultationOrderDetailsForInvoiceQuery,
  treatmentOrderDetailsForInvoiceQuery,
  checkSpouseOrPatientByAppointmentIdQuery,
  patientHeaderForInvoiceQuery,
  patientHeaderForInvoiceQueryTreatmentOrders,
  patientItemReturnConsultationQueryOtherThanPharmacy,
  patientItemReturnTreatementQueryOtherThanPharmacy,
  patientItemReturnHistoryOtherThanPharmacy
} = require("../queries/payment_queries");
let { invoiceTemplate } = require("../templates/invoiceTemplate");
let { patientHeaderForInvoice } = require("../templates/headerTemplates");
const GrnDetailsMasterModel = require("../models/Master/grnDetailsMaster");
const PatientPharmacyPurchaseReturnsModel = require("../models/Master/PatientPharmacyPurchaseReturnsModel");
const formFTemplate = require("../templates/formFTemplate");
const patientScanFormFAssociationsModel = require("../models/Associations/patientScanFormFAssociation");
const BaseService = require("../services/baseService");
const GenerateHtmlTemplate = require("../utils/templateUtils");
const PatientPurchaseReturnsModel = require("../models/Master/patientPurchaseReturnsModel");
class PaymentService extends BaseService {
  constructor(request, response, next) {
    super(request, response, next);
    this._request = request;
    this._response = response;
    this._next = next;
    this.mySqlConnection = MySqlConnection._instance;
    this.stockMySqlConnection = StockMySqlConnection._instance;
    this.razorpay = RazorpayConnection.getRazorpay();
    this.htmlTemplateGenerationObj = new GenerateHtmlTemplate();
  }

  async getBranchIdByRefIdAndType(refId, type) {
    try {
      let branchId = null,
        branchCode = null;
      if (type === "Treatment") {
        const result = await this.mySqlConnection.query(
          `SELECT taa.branchId, bm.branchCode  FROM treatment_appointment_line_bills_associations talba
           INNER JOIN treatment_appointments_associations taa ON taa.id = talba.appointmentId
           INNER JOIN branch_master bm ON bm.id = taa.branchId
           WHERE talba.id = :refId`,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { refId }
          }
        );
        if (result && result.length > 0) {
          branchId = result[0].branchId;
          branchCode = result[0].branchCode;
        }
      } else if (type === "Consultation") {
        const result = await this.mySqlConnection.query(
          `SELECT caa.branchId, bm.branchCode FROM consultation_appointment_line_bills_associations calba
           INNER JOIN consultation_appointments_associations caa ON caa.id = calba.appointmentId
           INNER JOIN branch_master bm ON bm.id = caa.branchId
           WHERE calba.id = :refId`,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { refId }
          }
        );
        if (result && result.length > 0) {
          branchId = result[0].branchId;
          branchCode = result[0].branchCode;
        }
      }
      return { branchId, branchCode };
    } catch (err) {
      console.error("Error while fetching branchId:", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async getOrderIdHandlerservice() {
    try {
      const validOrderData = await orderDetailsSchema.validateAsync(
        this._request.body
      );
      const {
        totalOrderAmount,
        paidOrderAmount,
        discountAmount,
        orderDetails,
        couponCode,
        paymentMode,
        productType
      } = validOrderData;

      let orderId;

      let totalPayableAmount = totalOrderAmount - discountAmount;
      if (totalPayableAmount != paidOrderAmount) {
        throw new createError.BadRequest(Constants.PAYABLE_AMOUNT_WRONG);
      }
      if (paymentMode === "ONLINE") {
        let refId = orderDetails[0].refId;
        let type = orderDetails[0].type;
        console.log("productType:", productType);
        console.log("refId:", refId);
        console.log("type:", type);
        if (!productType || !refId || !type) {
          throw new createError.BadRequest(
            "Product type, refId or type is missing in order details"
          );
        }

        const { branchId, branchCode } = await this.getBranchIdByRefIdAndType(
          refId,
          type
        );
        if (!branchId) {
          throw new createError.NotFound(Constants.BRANCH_NOT_FOUND);
        }
        console.log("Branch ID:", branchId);
        console.log("Branch Code:", branchCode);
        let accountId = null;
        if (branchId === 2) {
          if (productType === "PHARMACY") {
            // HNK Pharmacy
            accountId = "acc_QvFVMPGxSRDCc8";
          } else {
            // HNK Frontdesk
            accountId = "acc_QvFxqAwkJA1KCX";
          }
        } else if (branchId === 1 || branchId === 3 || branchId === 4) {
          accountId = "acc_QjXMw2peC4keGS";
        } else {
          throw new createError.NotFound(Constants.BRANCH_NOT_FOUND);
        }
        console.log("Account ID:", accountId);
        if (!accountId) {
          throw new createError.NotFound(Constants.ACCOUNT_NOT_FOUND);
        }
        try {
          const razorpayOrder = await this.razorpay.orders.create({
            amount: paidOrderAmount * 100,
            currency: "INR",
            receipt: uuidv4(),
            payment_capture: 1,
            notes: { branch: branchCode },
            transfers: [
              {
                account: accountId,
                amount: paidOrderAmount * 100,
                currency: "INR",
                notes: { purpose: "Order routed to sub-account" }
              }
            ]
          });
          orderId = razorpayOrder.id;
        } catch (err) {
          console.log("Razorpay order creation failed:", err?.error || err);
          throw new createError.InternalServerError(
            "Failed to create Razorpay order"
          );
        }
      } else {
        orderId = moment.tz("Asia/Kolkata").format("YYYYMMDDHHmmssSS");
      }

      const orderData = {
        orderId,
        totalOrderAmount,
        paidOrderAmount,
        discountAmount,
        couponCode,
        orderDetails: JSON.stringify(orderDetails),
        orderDate: moment()
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss"),
        paymentMode,
        productType,
        paymentStatus:
          paymentMode === "CASH" || paymentMode === "UPI" ? "PAID" : "DUE"
      };

      const orderDetailsResponse = await OrderDetailsMasterModel.create(
        orderData
      );

      if (productType == "CONSULTATION FEE") {
        // Handle consultation free seperately
        return this.consultationFeeOrderIdService(
          orderData,
          orderDetailsResponse
        );
      }

      if (paymentMode != "ONLINE") {
        const getExistingOrderDetails = JSON.parse(
          orderDetailsResponse.dataValues.orderDetails
        );

        await this.mySqlConnection.transaction(async t => {
          // Fetching the appointment Id and Type
          let appointmentId = null;
          if (getExistingOrderDetails[0].type == "Treatment") {
            let appointmentData = await treatmentAppointmentLineBillsAssociations
              .findOne({
                where: {
                  id: getExistingOrderDetails[0].refId
                }
              })
              .catch(err => {
                console.log("Error while fetching appointment Details", err);
                throw new createError.InternalServerError(
                  Constants.SOMETHING_ERROR_OCCURRED
                );
              });

            if (!lodash.isEmpty(appointmentData)) {
              appointmentId = appointmentData.appointmentId;
            }
          } else if (getExistingOrderDetails[0].type == "Consultation") {
            let appointmentData = await consultationAppointmentLineBillsAssociations
              .findOne({
                where: {
                  id: getExistingOrderDetails[0].refId
                }
              })
              .catch(err => {
                console.log("Error while fetching appointment Details", err);
                throw new createError.InternalServerError(
                  Constants.SOMETHING_ERROR_OCCURRED
                );
              });

            if (!lodash.isEmpty(appointmentData)) {
              appointmentId = appointmentData.appointmentId;
            }
          }

          const orderDataUpdated = {
            ...orderDetailsResponse.dataValues,
            paymentStatus: "PAID",
            appointmentId,
            type: getExistingOrderDetails[0].type
          };

          await OrderDetailsMasterModel.update(orderDataUpdated, {
            where: { orderId },
            transaction: t
          });

          if (getExistingOrderDetails.length > 0) {
            // Use Promise.all to wait for all async operations to complete
            await Promise.all(
              getExistingOrderDetails.map(async item => {
                const refId = item.refId;
                const type = item.type;

                if (type === "Treatment") {
                  await treatmentAppointmentLineBillsAssociations.update(
                    { status: "PAID" },
                    { where: { id: refId }, transaction: t }
                  );
                } else {
                  await consultationAppointmentLineBillsAssociations.update(
                    { status: "PAID" },
                    { where: { id: refId }, transaction: t }
                  );
                }

                // If type is PHARMACY then return the unpurchased stock
                if (orderDetailsResponse.productType == "PHARMACY") {
                  let itemId = null;
                  if (type == "Treatment") {
                    let itemInfo = await treatmentAppointmentLineBillsAssociations.findOne(
                      {
                        where: { id: refId },
                        transaction: t
                      }
                    );
                    if (!lodash.isEmpty(itemInfo)) {
                      itemId = itemInfo.billTypeValue;
                    }
                  } else {
                    let itemInfo = await consultationAppointmentLineBillsAssociations.findOne(
                      {
                        where: { id: refId },
                        transaction: t
                      }
                    );
                    if (!lodash.isEmpty(itemInfo)) {
                      itemId = itemInfo.billTypeValue;
                    }
                  }
                  // Perform stock operations in a separate transaction
                  await this.stockMySqlConnection.transaction(
                    async stockTransaction => {
                      await this.returnStockToGrn(
                        item,
                        itemId,
                        stockTransaction
                      );
                    }
                  );
                }
              })
            );

            // If Scans then handle form F Templates
            await this.generateFormFTemplatesForScans(
              getExistingOrderDetails,
              productType,
              getExistingOrderDetails[0].type,
              appointmentId,
              t
            );
          }
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

  async returnStockToGrn(item, itemId, transaction) {
    const purchaseDetailsTempData = await PharmacyPurchaseDetailsTemp.findOne({
      where: {
        refId: item.refId,
        type: item.type
      },
      transaction: transaction // Use the passed transaction
    });

    if (!lodash.isEmpty(purchaseDetailsTempData)) {
      let purchaseDetails = JSON.parse(purchaseDetailsTempData.purchaseDetails);

      // Use Promise.all to handle async
      await Promise.all(
        purchaseDetails.map(async details => {
          let grnId = details.grnId;
          let returnQuantity = details?.returnedQuantity || 0;
          try {
            await GrnItemsAssociationsModel.update(
              {
                totalQuantity: Sequelize.literal(
                  `totalQuantity + ${returnQuantity}`
                )
              },
              {
                where: {
                  grnId: grnId,
                  itemId: itemId
                },
                transaction: transaction
              }
            );
          } catch (err) {
            console.log("Error while updating GrnItemsAssociations", err);
            throw new createError.InternalServerError(
              Constants.SOMETHING_ERROR_OCCURRED
            );
          }
        })
      );

      await PharmacyPurchaseDetailsTemp.destroy({
        where: {
          refId: item.refId,
          type: item.type
        },
        transaction: transaction
      }).catch(err => {
        console.log("Error during destroying the temp data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }
  }

  async generateFormFTemplatesForScans(
    existedOrderDetails,
    productType,
    type,
    appointmentId,
    transaction
  ) {
    if (productType == "SCAN") {
      let query = "";
      if (type == "Treatment") {
        query = getTreatmentFormFPatientDetails;
      } else if (type == "Consultation") {
        query = getConsultationFormFPatientDetails;
      }

      let refIds = existedOrderDetails.map(each => {
        return each.refId;
      });

      let data = await this.mySqlConnection
        .query(query, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            refIds: refIds
          },
          transaction: transaction
        })
        .catch(err => {
          console.log("Error while generating the form F template", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(data) && data.length > 0) {
        data = data[0].detailsForFormF;
        let formFTemplates = [];
        data.forEach(row => {
          if (row?.isFormFRequired == 1) {
            let currentFormFTemplate = formFTemplate;
            currentFormFTemplate = currentFormFTemplate
              .replaceAll("{patientName}", row?.patientName?.toUpperCase())
              .replaceAll("{patientAge}", row?.patientAge)
              .replaceAll("{guardianName}", row?.guardianName || "")
              .replaceAll("{completeaddress}", row?.completeAddress)
              .replaceAll("{doctorName}", row?.doctorName)
              .replaceAll("{scanName}", row?.scanName)
              .replaceAll("{hospitalAddress}", row?.hospitalAddress)
              .replaceAll("{registrationNumber}", row?.resgistrationNumber);
            formFTemplates.push({
              appointmentId: appointmentId,
              type: type,
              formFTemplate: currentFormFTemplate,
              isReviewed: 0,
              scanId: row?.scanId
            });
          }
        });

        await patientScanFormFAssociationsModel
          .bulkCreate(formFTemplates, {
            transaction: transaction
          })
          .catch(err => {
            console.log("Error while inserting form f templates", err);
            throw new createError.InternalServerError(
              Constants.SOMETHING_ERROR_OCCURRED
            );
          });
      }
    }
  }

  async sendTransactionIdservice() {
    try {
      const validTransactionData = await transactionDetailsSchema.validateAsync(
        this._request.body
      );
      const { orderId, transactionId, transactionType } = validTransactionData;

      // Check if it is consultation fee online payment or not
      const existedOrderDetails = await OrderDetailsMasterModel.findOne({
        where: { orderId }
      });

      if (!existedOrderDetails) {
        throw new createError.NotFound(Constants.ORDER_DETAILS_DOES_NOT_EXIST);
      }

      if (existedOrderDetails.dataValues.productType == "CONSULTATION FEE") {
        return this.consultationFeeTransactionIdService(
          orderId,
          existedOrderDetails,
          transactionId
        );
      }

      // If not consultation fee, proceed with next steps
      await this.mySqlConnection.transaction(async t => {
        const getExistingOrderDetails = JSON.parse(
          existedOrderDetails.dataValues.orderDetails
        );

        // Fetching the appointment Id and Type
        let appointmentId = null;
        if (getExistingOrderDetails[0].type == "Treatment") {
          let appointmentData = await treatmentAppointmentLineBillsAssociations
            .findOne({
              where: {
                id: getExistingOrderDetails[0].refId
              }
            })
            .catch(err => {
              console.log("Error while fetching appointment Details", err);
              throw new createError.InternalServerError(
                Constants.SOMETHING_ERROR_OCCURRED
              );
            });

          if (!lodash.isEmpty(appointmentData)) {
            appointmentId = appointmentData.appointmentId;
          }
        } else if (getExistingOrderDetails[0].type == "Consultation") {
          let appointmentData = await consultationAppointmentLineBillsAssociations
            .findOne({
              where: {
                id: getExistingOrderDetails[0].refId
              }
            })
            .catch(err => {
              console.log("Error while fetching appointment Details", err);
              throw new createError.InternalServerError(
                Constants.SOMETHING_ERROR_OCCURRED
              );
            });

          if (!lodash.isEmpty(appointmentData)) {
            appointmentId = appointmentData.appointmentId;
          }
        }

        const orderDataUpdated = {
          ...existedOrderDetails.dataValues,
          transactionId,
          transactionType,
          paymentStatus: "PAID",
          appointmentId,
          type: getExistingOrderDetails[0].type
        };

        await OrderDetailsMasterModel.update(orderDataUpdated, {
          where: { orderId },
          transaction: t
        });

        if (getExistingOrderDetails.length > 0) {
          // Use Promise.all to wait for all async operations to complete
          await Promise.all(
            getExistingOrderDetails.map(async item => {
              const refId = item.refId;
              const type = item.type;

              if (type === "Treatment") {
                await treatmentAppointmentLineBillsAssociations.update(
                  { status: "PAID" },
                  { where: { id: refId }, transaction: t }
                );
              } else {
                await consultationAppointmentLineBillsAssociations.update(
                  { status: "PAID" },
                  { where: { id: refId }, transaction: t }
                );
              }

              // If type is PHARMACY then return the unpurchased stock
              if (existedOrderDetails.productType == "PHARMACY") {
                let itemId = null;
                if (type == "Treatment") {
                  let itemInfo = await treatmentAppointmentLineBillsAssociations.findOne(
                    {
                      where: { id: refId },
                      transaction: t
                    }
                  );
                  if (!lodash.isEmpty(itemInfo)) {
                    itemId = itemInfo.billTypeValue;
                  }
                } else {
                  let itemInfo = await consultationAppointmentLineBillsAssociations.findOne(
                    {
                      where: { id: refId },
                      transaction: t
                    }
                  );
                  if (!lodash.isEmpty(itemInfo)) {
                    itemId = itemInfo.billTypeValue;
                  }
                }
                // Perform stock operations in a separate transaction
                await this.stockMySqlConnection.transaction(
                  async stockTransaction => {
                    await this.returnStockToGrn(item, itemId, stockTransaction);
                  }
                );
              }
            })
          );

          // If Scans then handle form F Templates
          await this.generateFormFTemplatesForScans(
            getExistingOrderDetails,
            existedOrderDetails.productType,
            getExistingOrderDetails[0].type,
            appointmentId,
            t
          );
        }
      });

      return Constants.PAYMENT_SUCCESSFUL;
    } catch (err) {
      console.error("Error while processing transaction:", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  formatPrescriptionDetails = details => {
    if (details.startsWith("OTHER_")) {
      return details.split("_")[1];
    }
    return details;
  };

  async generatePatientHeaderInformationForInvoice(
    appointmentId,
    type,
    id,
    isSpouse,
    orderDetails
  ) {
    let data = null;
    if (appointmentId == null) {
      // It is treatment based order, so information using visitId
      data = await this.mysqlConnection
        .query(patientHeaderForInvoiceQueryTreatmentOrders, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: id,
            isSpouse: isSpouse
          }
        })
        .catch(err => {
          console.log(
            "Error while fetching patient information for header",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    } else {
      data = await this.mysqlConnection
        .query(patientHeaderForInvoiceQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            appointmentId: appointmentId,
            type: type,
            isSpouse: isSpouse
          }
        })
        .catch(err => {
          console.log(
            "Error while fetching patient information for header",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    }

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

  /*
    Spouse Flag Conditions

    1.Scans, labs, embryology, pharmacy -> LineBills Based
    2.Consultation Fee -> appointment reason based
    3.Treatement milestone with package -> always patient 
    4.Treatement without package -> appointment reason based

    Point 1 & 2 Covered In getOrderDetailsForInvoiceWithSpouseFlag
    Point 3 & 4 Covered in generateProductInformationTableForTreatmentOrders
  */
  async getOrderDetailsForInvoiceWithSpouseFlag(
    orderDetails,
    type,
    productType,
    appointmentId
  ) {
    if (productType == "CONSULTATION FEE") {
      let data = await this.mySqlConnection
        .query(checkSpouseOrPatientByAppointmentIdQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            type: type,
            appointmentId: appointmentId
          }
        })
        .catch(err => {
          console.log("Error while fetching isSpouse Or patient", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      if (!lodash.isEmpty(orderDetails) && orderDetails.length > 0) {
        return [
          {
            ...orderDetails[0],
            prescribedTo:
              !lodash.isEmpty(data) && data[0].isSpouse == 0
                ? "PATIENT"
                : "SPOUSE"
          }
        ];
      }
      return [];
    } else {
      let refIds = orderDetails.map(each => {
        return each.refId;
      });

      let query = null;
      if (type == "Consultation") {
        query = consultationOrderDetailsForInvoiceQuery;
      } else if (type == "Treatment") {
        query = treatmentOrderDetailsForInvoiceQuery;
      }
      let itemInfo = await this.mySqlConnection.query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          refId: refIds.map(id => String(id)),
          productType: productType
        }
      });
      if (!lodash.isEmpty(itemInfo)) {
        return itemInfo[0]?.itemDetails;
      }
    }
    return [];
  }

  async generateProductInformationTable(
    appointmentId,
    type,
    productType,
    orderId
  ) {
    const purchaseDetails = await OrderDetailsMasterModel.findOne({
      where: {
        appointmentId: appointmentId,
        type: type,
        productType: productType,
        orderId: orderId
      }
    }).catch(err => {
      console.log("Error whole getting the details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    if (productType == "PHARMACY") {
      // PHARMACY HANDLED DIFFERENYLY AS ITEM COST IS BASED ON THE GRN , IT IS AVAILABLE IN ORDER DETAILS
      // WE NEED PRESCIBED AND PURCHASE QUANTITY IN PHARMACY
      let orderDetails = JSON.parse(purchaseDetails?.orderDetails);
      let refIds = orderDetails.map(each => {
        return each.refId;
      });

      let query = null;
      if (type == "Consultation") {
        query = pharmacyConsultationProductTable;
      } else if (type == "Treatment") {
        query = pharmacyTreatmentProductTable;
      }

      let itemInfo = await this.mySqlConnection.query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          refId: refIds.map(id => String(id))
        }
      });

      if (!lodash.isEmpty(itemInfo)) {
        itemInfo = itemInfo[0];
        let orderData = itemInfo?.itemInfo?.map((info, index) => {
          const costInfo = orderDetails.find(
            details => details.refId == info.refId
          );
          return {
            serialNumber: index + 1,
            itemName: info.itemName,
            presQty: info.purchaseQuantity,
            purcQty: info.prescribedQuantity,
            totalCost: costInfo ? `Rs. ${costInfo.totalCost}` : "N/A",
            prescribedTo: info?.prescribedTo
          };
        });
        return orderData;
      }
    } else if (
      ["LAB TEST", "SCAN", "EMBRYOLOGY", "CONSULTATION FEE"].includes(
        productType
      )
    ) {
      let orderDetails = JSON.parse(purchaseDetails?.orderDetails);
      orderDetails = await this.getOrderDetailsForInvoiceWithSpouseFlag(
        JSON.parse(purchaseDetails?.orderDetails),
        type,
        productType,
        appointmentId
      );
      return orderDetails.map((item, index) => ({
        serialNumber: index + 1,
        ...item
      }));
    }
    return []; // IF NONE MATCHED
  }

  async generateProductInformationTableForTreatmentOrders(
    type,
    productType,
    orderId
  ) {
    const purchaseDetails = await TreatmentOrdersMasterModel.findOne({
      where: {
        type: type,
        productType: productType,
        orderId: orderId
      }
    }).catch(err => {
      console.log("Error whole getting the details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    if (productType.indexOf("APPOINTMENT") === -1) {
      // MILESTONE PAYMENT
      return [
        {
          serialNumber: 1,
          itemName: productType,
          totalCost: purchaseDetails?.paidOrderAmountBeforeDiscount,
          prescribedTo: "PATIENT" // Always Patient for Milestone Package Based
        }
      ];
    } else {
      // APPOINTMENT BASED MILESTONE
      let data = await this.mySqlConnection
        .query(getAppointmentReasonForInvoiceQuery, {
          replacements: {
            orderId: orderId
          },
          type: Sequelize.QueryTypes.SELECT
        })
        .catch(err => {
          console.log(
            "Error while fetching the appointmnet reason for treatement",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!lodash.isEmpty(data)) {
        return [
          {
            serialNumber: 1,
            itemName: data[0]?.appointmentReason,
            totalCost: purchaseDetails?.paidOrderAmountBeforeDiscount,
            prescribedTo: data[0]?.isSpouse == 0 ? "PATIENT" : "SPOUSE"
          }
        ];
      }
    }
  }

  async generateInvoiceService() {
    const {
      appointmentId,
      type,
      productType,
      id
    } = await invoiceSchema.validateAsync(this._request.body);

    let orderDetails = null;
    let isTreatmentOrder = false;
    // For Invoice Sepearate Function to generate A5 Size Header
    const hospitalLogoHeaderTemplate = await this.hospitalLogoHeaderTemplateForInvoice(
      appointmentId,
      type,
      id
    );

    if (appointmentId) {
      // For Normal orders other than Treatment Milestones
      orderDetails = await OrderDetailsMasterModel.findOne({
        where: {
          appointmentId: appointmentId,
          type: type,
          productType: productType
        }
      }).catch(err => {
        console.log("Error while fetching order details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    } else {
      isTreatmentOrder = true;
      orderDetails = await TreatmentOrdersMasterModel.findOne({
        where: {
          id: id,
          type: type,
          productType: productType
        }
      }).catch(err => {
        console.log("Error while fetching order details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    if (lodash.isEmpty(orderDetails)) {
      throw new createError.BadRequest(Constants.PAYMENT_DETAILS_NOT_FOUND);
    }

    let invoiceDetailsQuery = null;
    if (type == "Consultation") {
      if (appointmentId) {
        invoiceDetailsQuery =
          invoiceForConsultationAppointmentsQuery +
          (id ? ` AND odm.id = :id` : "");
      }
    } else if (type == "Treatment") {
      if (appointmentId) {
        invoiceDetailsQuery =
          invoiceForTreatementAppointmentsQuery +
          (id ? ` AND odm.id = :id` : "");
      } else {
        invoiceDetailsQuery = invoiceForTreatmentOrdersMileStoneQuery;
      }
    }

    let invoiceTemplates = [];
    let invoiceDetailsList = await this.mySqlConnection
      .query(invoiceDetailsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          appointmentId: appointmentId,
          productType: productType,
          id: id
        }
      })
      .catch(err => {
        console.log("Error while getting invoice details data", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

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
        isPharmacy: productType == "PHARMACY" ? 1 : 0,
        isScan: productType == "SCAN" ? 1 : 0,
        isLab: productType == "LAB TEST" ? 1 : 0,
        isEmbryology: productType == "EMBRYOLOGY" ? 1 : 0,
        isConsultationFee: productType == "CONSULTATION FEE" ? 1 : 0,
        isAppointment: productType.indexOf("APPOINTMENT") !== -1 ? 1 : 0, //  APPOINTMENT_45 Etc.
        isMileStone:
          !appointmentId && productType.indexOf("APPOINTMENT") === -1 ? 1 : 0 // Treatment Order and not of type APPOINTMENT_45 etc.
      };

      let productTableData;
      if (!isTreatmentOrder) {
        //  For all orders except treatment milestones
        productTableData = await this.generateProductInformationTable(
          appointmentId,
          type,
          productType,
          invoiceDetails?.orderDetails?.orderNo
        );
      } else {
        productTableData = await this.generateProductInformationTableForTreatmentOrders(
          type,
          productType,
          invoiceDetails?.orderDetails?.orderNo
        );
      }

      const spouseProducts = productTableData.filter(
        item => item.prescribedTo === "SPOUSE"
      );
      const nonSpouseProducts = productTableData.filter(
        item => item.prescribedTo === "PATIENT"
      );

      if (nonSpouseProducts.length > 0) {
        const patientHeaderForInvoice = await this.generatePatientHeaderInformationForInvoice(
          appointmentId,
          type,
          id,
          0,
          invoiceDetails?.orderDetails
        );

        const nonSpouseInfo = {
          ...patientOrderAndPaymentInfo,
          productTable: nonSpouseProducts,
          patientHeaderInformation: patientHeaderForInvoice
        };

        const htmlContent = await this.htmlTemplateGenerationObj.generateTemplateFromText(
          invoiceTemplate,
          nonSpouseInfo
        );

        invoiceTemplates.push(htmlContent);
      }

      if (spouseProducts.length > 0) {
        const patientHeaderForInvoice = await this.generatePatientHeaderInformationForInvoice(
          appointmentId,
          type,
          id,
          1,
          invoiceDetails?.orderDetails
        );

        const spouseInfo = {
          ...patientOrderAndPaymentInfo,
          productTable: spouseProducts,
          patientHeaderInformation: patientHeaderForInvoice
        };

        const htmlContent = await this.htmlTemplateGenerationObj.generateTemplateFromText(
          invoiceTemplate,
          spouseInfo
        );

        invoiceTemplates.push(htmlContent);
      }
    }
    let finalTemplate = invoiceTemplates.join("");
    return `
      <html>
        <head>
          <title>Origins Invoice</title>
        </head>
        <body style="margin: 0; padding: 0;">
          <div style="display: flex;flex-direction: column; justify-content: center; align-items: center;">  
            ${finalTemplate}
          </div>
        </body>
      </html>
    `;
  }

  async getSaleReturnInformationService() {
    const { orderId } = this._request.params;

    if (!orderId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "Order Id")
      );
    }

    const orderDetails = await OrderDetailsMasterModel.findOne({
      where: {
        orderId: orderId,
        productType: "PHARMACY",
        paymentStatus: "PAID"
      }
    }).catch(err => {
      console.log("error while fetching order details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    let orderInformation = null;

    if (lodash.isEmpty(orderDetails)) {
      throw new createError.BadRequest(Constants.ORDER_DETAILS_DOES_NOT_EXIST);
    }

    if (orderDetails?.type == "Consultation") {
      orderInformation = await this.mySqlConnection
        .query(patientItemReturnConsultationQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            orderId: orderId
          }
        })
        .catch(err => {
          console.log(
            "Error while fetching order information of pharmacy consultation",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    } else if (orderDetails?.type == "Treatment") {
      orderInformation = await this.mySqlConnection
        .query(patientItemReturnTreatementQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            orderId: orderId
          }
        })
        .catch(err => {
          console.log(
            "Error while fetching order information of pharmacy treatment",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    }

    if (!lodash.isEmpty(orderInformation) && orderInformation.length > 0) {
      orderInformation = orderInformation[0];
    }

    // Enhance purchasedItems with GRN info from pharmacy_purchase_details_temp if missing
    if (
      orderInformation &&
      orderInformation.purchasedItems &&
      Array.isArray(orderInformation.purchasedItems) &&
      orderInformation.purchasedItems.length > 0
    ) {
      // Check if any item is missing GRN info in purchaseDetails
      const itemsNeedingGrn = orderInformation.purchasedItems.filter(
        item =>
          !item.purchaseDetails ||
          !Array.isArray(item.purchaseDetails) ||
          item.purchaseDetails.length === 0 ||
          !item.purchaseDetails.some(pd => pd.grnId)
      );

      if (itemsNeedingGrn.length > 0) {
        console.log(
          `Found ${itemsNeedingGrn.length} items missing GRN info, fetching from pharmacy_purchase_details_temp`
        );

        // Fetch GRN info from pharmacy_purchase_details_temp for items missing it
        await Promise.all(
          itemsNeedingGrn.map(async item => {
            try {
              const tempData = await PharmacyPurchaseDetailsTemp.findOne({
                where: {
                  refId: item.refId,
                  type: orderDetails.type
                }
              });

              if (tempData && tempData.purchaseDetails) {
                const purchaseDetails =
                  typeof tempData.purchaseDetails === "string"
                    ? JSON.parse(tempData.purchaseDetails)
                    : tempData.purchaseDetails;

                if (
                  Array.isArray(purchaseDetails) &&
                  purchaseDetails.length > 0
                ) {
                  // Merge GRN info from temp table
                  item.purchaseDetails = purchaseDetails.map(pd => ({
                    grnId: pd.grnId,
                    expiryDate: pd.expiryDate,
                    mrpPerTablet: pd.mrpPerTablet,
                    usedQuantity:
                      pd.usedQuantity || pd.initialUsedQuantity || 0,
                    initialUsedQuantity:
                      pd.initialUsedQuantity || pd.usedQuantity || 0,
                    batchNo: pd.batchNo,
                    returnedQuantity: pd.returnedQuantity || 0
                  }));

                  console.log(
                    `Added GRN info from temp table for refId ${item.refId}:`,
                    item.purchaseDetails
                  );
                }
              }
            } catch (err) {
              console.error(
                `Error fetching GRN from temp table for refId ${item.refId}:`,
                err
              );
            }
          })
        );
      }
    }

    // If purchasedItems is null or empty, try to parse orderDetails directly as fallback
    if (
      orderInformation &&
      (!orderInformation.purchasedItems ||
        (Array.isArray(orderInformation.purchasedItems) &&
          orderInformation.purchasedItems.length === 0))
    ) {
      console.log(
        "purchasedItems is empty, attempting to parse orderDetails directly"
      );

      try {
        // Parse orderDetails JSON if it exists
        if (orderDetails && orderDetails.orderDetails) {
          const parsedOrderDetails =
            typeof orderDetails.orderDetails === "string"
              ? JSON.parse(orderDetails.orderDetails)
              : orderDetails.orderDetails;

          if (
            Array.isArray(parsedOrderDetails) &&
            parsedOrderDetails.length > 0
          ) {
            console.log("Found orderDetails, creating fallback purchasedItems");

            // Create purchasedItems from orderDetails
            const fallbackPurchasedItems = parsedOrderDetails.map(item => ({
              refId: item.refId,
              itemId: item.id || item.itemId || item.refId,
              itemName: item.itemName || "N/A",
              purchaseQuantity: item.prescribed || item.purchaseQuantity || 0,
              returnQuantity: 0, // No returns yet
              totalCost: item.totalCost || 0,
              purchaseDetails: item.purchaseDetails || [] // May be empty but structure is correct
            }));

            // Add to orderInformation
            if (!orderInformation.purchasedItems) {
              orderInformation.purchasedItems = fallbackPurchasedItems;
            } else {
              orderInformation.purchasedItems = fallbackPurchasedItems;
            }

            console.log(
              "Created fallback purchasedItems:",
              fallbackPurchasedItems
            );
          }
        }
      } catch (parseError) {
        console.error("Error parsing orderDetails as fallback:", parseError);
      }
    }

    let itemReturnHistory = [];

    // Include orderDetails JSON in response for frontend fallback GRN extraction
    const response = {
      orderInformation,
      itemReturnHistory
    };

    // Add orderDetails to orderInformation if available
    if (orderDetails && orderDetails.orderDetails) {
      if (!orderInformation) {
        orderInformation = {};
      }
      // Include raw orderDetails for frontend to parse if needed
      orderInformation.rawOrderDetails = orderDetails.orderDetails;
    }

    return {
      orderInformation,
      itemReturnHistory
    };
  }

  async returnPharmacyItemService() {
    let returnInformation = await returnPharmacyItemSchema.validateAsync(
      this._request.body
    );

    const {
      patientId,
      orderId,
      totalAmount,
      type,
      returnDetails,
      refundMethod
    } = returnInformation;

    // Validate order exists and is paid
    const orderDetails = await OrderDetailsMasterModel.findOne({
      where: {
        orderId: orderId,
        paymentStatus: "PAID",
        productType: "PHARMACY"
      }
    }).catch(err => {
      console.log("error while fetching order details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(orderDetails)) {
      throw new createError.BadRequest(Constants.ORDER_DETAILS_DOES_NOT_EXIST);
    }

    // Start transaction
    const defaultDbTransaction = await this.mySqlConnection.transaction();
    const stockTransaction = await this.stockMySqlConnection.transaction();

    try {
      // Process each return detail
      await Promise.all(
        returnDetails.map(async returnDetail => {
          const { refId, itemId, returnInfo, returnQuantity } = returnDetail;

          // Calculate total return quantity - use returnQuantity directly if returnInfo is not provided
          let totalReturnQty = 0;
          if (
            returnInfo &&
            Array.isArray(returnInfo) &&
            returnInfo.length > 0
          ) {
            // If returnInfo is provided, use it (legacy support)
            totalReturnQty = returnInfo.reduce(
              (sum, info) => sum + (info.returnQuantity || 0),
              0
            );
          } else if (returnQuantity) {
            // Use returnQuantity directly (new approach - no GRN required)
            totalReturnQty = returnQuantity;
          }

          if (totalReturnQty <= 0) {
            return; // Skip if no quantity to return
          }

          // Update returnQuantity in line bills associations
          let lineBillModel;
          if (type === "Consultation") {
            lineBillModel = consultationAppointmentLineBillsAssociations;
          } else if (type === "Treatment") {
            lineBillModel = treatmentAppointmentLineBillsAssociations;
          } else {
            throw new createError.BadRequest(Constants.INVALID_OPERATION);
          }

          // Get current return quantity and add to it
          const currentLineBill = await lineBillModel
            .findOne({
              where: { id: refId },
              transaction: defaultDbTransaction
            })
            .catch(err => {
              console.log("Error while fetching line bill", err);
              throw new createError.InternalServerError(
                Constants.SOMETHING_ERROR_OCCURRED
              );
            });

          if (lodash.isEmpty(currentLineBill)) {
            throw new createError.BadRequest(
              "Line bill not found for refId: " + refId
            );
          }

          const currentReturnQty = currentLineBill.returnQuantity || 0;
          const newReturnQty = currentReturnQty + totalReturnQty;
          const purchaseQty = currentLineBill.purchaseQuantity || 0;

          // Validate return quantity doesn't exceed purchase quantity
          if (newReturnQty > purchaseQty) {
            throw new createError.BadRequest(
              `Return quantity (${newReturnQty}) cannot exceed purchase quantity (${purchaseQty}) for item ${refId}`
            );
          }

          // Update return quantity in line bills
          await lineBillModel
            .update(
              {
                returnQuantity: newReturnQty
              },
              {
                where: { id: refId },
                transaction: defaultDbTransaction
              }
            )
            .catch(err => {
              console.log("Error while updating return quantity", err);
              throw new createError.InternalServerError(
                Constants.SOMETHING_ERROR_OCCURRED
              );
            });

          // Update stock - add back quantities to pharmacy stock
          // If returnInfo with GRN is provided, use it; otherwise, find available GRNs by itemId and branchId
          if (
            returnInfo &&
            Array.isArray(returnInfo) &&
            returnInfo.length > 0
          ) {
            // Legacy approach: Update specific GRNs if provided
            await Promise.all(
              returnInfo.map(async info => {
                const { grnId, returnQuantity } = info;

                if (!grnId || returnQuantity <= 0) {
                  return;
                }

                // Add quantity back to specific GRN stock
                await GrnItemsAssociationsModel.update(
                  {
                    totalQuantity: Sequelize.literal(
                      `totalQuantity + ${returnQuantity}`
                    )
                  },
                  {
                    where: {
                      grnId: grnId,
                      itemId: itemId
                    },
                    transaction: stockTransaction
                  }
                ).catch(err => {
                  console.log("Error while updating GRN stock", err);
                  throw new createError.InternalServerError(
                    Constants.SOMETHING_ERROR_OCCURRED
                  );
                });
              })
            );
          } else {
            // New approach: Update stock by itemId and branchId (no GRN required)
            // Get branchId from appointment
            const { branchId } = await this.getBranchIdByRefIdAndType(
              refId,
              type
            );

            if (!branchId) {
              console.warn(
                `Could not find branchId for refId ${refId}, type ${type}`
              );
              // Continue without stock update - refund will still be processed
            } else {
              // Find available GRN items for this itemId and branchId (not expired, not returned)
              const availableGrnItems = await this.stockMySqlConnection
                .query(
                  `SELECT gia.id, gia.grnId, gia.totalQuantity, gia.expiryDate
                   FROM stockmanagement.grn_items_associations gia
                   INNER JOIN stockmanagement.grn_master gm ON gm.id = gia.grnId
                   WHERE gia.itemId = :itemId 
                     AND gm.branchId = :branchId
                     AND CAST(NOW() AS DATE) < gia.expiryDate
                     AND gia.isReturned = 0
                   ORDER BY gia.expiryDate ASC
                   LIMIT 10`,
                  {
                    type: Sequelize.QueryTypes.SELECT,
                    replacements: {
                      itemId: itemId,
                      branchId: branchId
                    },
                    transaction: stockTransaction
                  }
                )
                .catch(err => {
                  console.log("Error while fetching available GRN items", err);
                  // Don't throw - continue without stock update
                  return [];
                });

              if (availableGrnItems && availableGrnItems.length > 0) {
                // Distribute return quantity across available GRNs (FIFO - earliest expiry first)
                // Add all return quantity to the first available GRN (simplest approach)
                // Alternatively, could distribute proportionally, but for returns, adding to first GRN is standard
                const firstGrnItem = availableGrnItems[0];

                await GrnItemsAssociationsModel.update(
                  {
                    totalQuantity: Sequelize.literal(
                      `totalQuantity + ${totalReturnQty}`
                    )
                  },
                  {
                    where: {
                      id: firstGrnItem.id
                    },
                    transaction: stockTransaction
                  }
                ).catch(err => {
                  console.log(
                    `Error while updating GRN stock for grnId ${firstGrnItem.grnId}`,
                    err
                  );
                  throw new createError.InternalServerError(
                    Constants.SOMETHING_ERROR_OCCURRED
                  );
                });

                console.log(
                  `Added ${totalReturnQty} to stock for itemId ${itemId}, grnId ${firstGrnItem.grnId}, branchId ${branchId}`
                );
              } else {
                console.warn(
                  `No available GRN items found for itemId ${itemId}, branchId ${branchId} to return stock`
                );
                // Continue - refund will be processed even if stock can't be updated
                // This allows refunds to proceed even if stock structure is incomplete
              }
            }
          }
        })
      );

      // Update orderDetails JSON to reflect returned quantities
      let orderDetailsJson = orderDetails.orderDetails;
      if (typeof orderDetailsJson === "string") {
        orderDetailsJson = JSON.parse(orderDetailsJson);
      }

      // Update return quantities in orderDetails JSON
      returnDetails.forEach(returnDetail => {
        const { refId, returnInfo, returnQuantity } = returnDetail;
        // Calculate total return quantity
        let totalReturnQty = 0;
        if (returnInfo && Array.isArray(returnInfo) && returnInfo.length > 0) {
          totalReturnQty = returnInfo.reduce(
            (sum, info) => sum + (info.returnQuantity || 0),
            0
          );
        } else if (returnQuantity) {
          totalReturnQty = returnQuantity;
        }

        const orderItem = orderDetailsJson.find(item => item.refId === refId);
        if (orderItem) {
          // Update returnedQuantity in purchaseDetails
          if (
            orderItem.purchaseDetails &&
            Array.isArray(orderItem.purchaseDetails) &&
            orderItem.purchaseDetails.length > 0
          ) {
            if (
              returnInfo &&
              Array.isArray(returnInfo) &&
              returnInfo.length > 0
            ) {
              // If returnInfo is provided, update specific GRNs
              orderItem.purchaseDetails.forEach((purchaseDetail, index) => {
                const returnInfoForGrn = returnInfo.find(
                  info => info.grnId === purchaseDetail.grnId
                );
                if (returnInfoForGrn) {
                  const currentReturnedQty =
                    purchaseDetail.returnedQuantity || 0;
                  purchaseDetail.returnedQuantity =
                    currentReturnedQty + returnInfoForGrn.returnQuantity;
                  // Update usedQuantity (reduce it by returned quantity)
                  const currentUsedQty =
                    purchaseDetail.usedQuantity ||
                    purchaseDetail.initialUsedQuantity ||
                    0;
                  purchaseDetail.usedQuantity = Math.max(
                    0,
                    currentUsedQty - returnInfoForGrn.returnQuantity
                  );
                }
              });
            } else {
              // If returnInfo is empty, distribute returnQuantity across purchaseDetails
              // Add to first purchaseDetail (or distribute proportionally if needed)
              const firstPurchaseDetail = orderItem.purchaseDetails[0];
              if (firstPurchaseDetail) {
                const currentReturnedQty =
                  firstPurchaseDetail.returnedQuantity || 0;
                firstPurchaseDetail.returnedQuantity =
                  currentReturnedQty + totalReturnQty;
                // Update usedQuantity (reduce it by returned quantity)
                const currentUsedQty =
                  firstPurchaseDetail.usedQuantity ||
                  firstPurchaseDetail.initialUsedQuantity ||
                  0;
                firstPurchaseDetail.usedQuantity = Math.max(
                  0,
                  currentUsedQty - totalReturnQty
                );
              }
            }
          }
        }
      });

      // Save updated orderDetails
      await OrderDetailsMasterModel.update(
        {
          orderDetails: JSON.stringify(orderDetailsJson)
        },
        {
          where: { orderId: orderId },
          transaction: defaultDbTransaction
        }
      ).catch(err => {
        console.log("Error while updating orderDetails", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      // Create return record
      await PatientPharmacyPurchaseReturnsModel.create(
        {
          patientId,
          orderId,
          returnedDate: moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss"),
          type: type,
          returnDetails: JSON.stringify(returnDetails),
          totalAmount,
          refundMethod: refundMethod || "Cash"
        },
        {
          transaction: defaultDbTransaction
        }
      ).catch(err => {
        console.log("Error while inserting return record", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      // Commit transactions
      await defaultDbTransaction.commit();
      await stockTransaction.commit();

      return Constants.DATA_UPDATED_SUCCESS;
    } catch (err) {
      // Rollback transactions on error
      await defaultDbTransaction.rollback().catch(rollbackErr => {
        console.log("Error during rollback", rollbackErr);
      });
      await stockTransaction.rollback().catch(rollbackErr => {
        console.log("Error during stock rollback", rollbackErr);
      });

      if (err.isJoi) {
        throw new createError.BadRequest(err.message);
      }
      if (err.statusCode) {
        throw err;
      }
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async consultationFeeOrderIdService(orderData, orderDetailsResponse) {
    const { paymentMode, orderId } = orderData;

    const { appointmentId, type } = JSON.parse(orderData.orderDetails)[0];

    if (paymentMode != "ONLINE") {
      await OrderDetailsMasterModel.update(
        {
          paymentStatus: "PAID",
          appointmentId,
          type: type
        },
        {
          where: {
            orderId: orderId
          }
        }
      ).catch(err => {
        console.log(
          "Error while updating the status of order consultation",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    return orderDetailsResponse;
  }

  async consultationFeeTransactionIdService(
    orderId,
    existedOrderDetails,
    transactionId
  ) {
    const { appointmentId, type } = JSON.parse(
      existedOrderDetails.dataValues.orderDetails
    )[0];

    await OrderDetailsMasterModel.update(
      {
        paymentStatus: "PAID",
        appointmentId,
        transactionId: transactionId,
        type: type
      },
      {
        where: {
          orderId: orderId
        }
      }
    ).catch(err => {
      console.log("Error while updating the status of order consultation", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.PAYMENT_SUCCESSFUL;
  }

  async getSaleReturnInformationServiceLabScanAndEmbryology() {
    const { orderId } = this._request.params;

    if (!orderId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "Order Id")
      );
    }

    const orderDetails = await OrderDetailsMasterModel.findOne({
      where: {
        orderId: orderId,
        paymentStatus: "PAID"
      }
    }).catch(err => {
      console.log("error while fetching order details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    let orderInformation = null;

    if (lodash.isEmpty(orderDetails)) {
      throw new createError.BadRequest(Constants.ORDER_DETAILS_DOES_NOT_EXIST);
    }

    if (orderDetails?.type == "Consultation") {
      orderInformation = await this.mySqlConnection
        .query(patientItemReturnConsultationQueryOtherThanPharmacy, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            orderId: orderId
          }
        })
        .catch(err => {
          console.log(
            "Error while fetching order information of lab/scan/embryology consultation",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    } else if (orderDetails?.type == "Treatment") {
      orderInformation = await this.mySqlConnection
        .query(patientItemReturnTreatementQueryOtherThanPharmacy, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            orderId: orderId
          }
        })
        .catch(err => {
          console.log(
            "Error while fetching order information of lab/scan/embryology treatment",
            err
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    }

    let itemReturnHistory = await this.mySqlConnection
      .query(patientItemReturnHistoryOtherThanPharmacy, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          orderId: orderId
        }
      })
      .catch(err => {
        console.log(
          "Error while fetching order return history of lab/scan/embryology treatment",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return {
      orderInformation,
      itemReturnHistory: !lodash.isEmpty(itemReturnHistory)
        ? itemReturnHistory[0]?.return_history
        : []
    };
  }

  async returnItemServiceOtherThanPharmacy() {
    let returnInformation = await returnSchema.validateAsync(
      this._request.body
    );
    const orderDetails = await OrderDetailsMasterModel.findOne({
      where: {
        orderId: returnInformation.orderId,
        paymentStatus: "PAID"
      }
    }).catch(err => {
      console.log("error while fetching order details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(orderDetails)) {
      throw new createError.BadRequest(Constants.ORDER_DETAILS_DOES_NOT_EXIST);
    }

    const { patientId, orderId, totalAmount, type } = returnInformation;

    const defaultDbTransaction = await this.mySqlConnection.transaction();

    try {
      await Promise.all(
        // For Return Quantity in Consultation and Treatment Line Bills
        returnInformation?.returnDetails?.map(async eachRow => {
          const { refId } = eachRow;
          if (type == "Consultation") {
            await consultationAppointmentLineBillsAssociations
              .update(
                {
                  returnQuantity: 1
                },
                {
                  where: {
                    id: refId
                  },
                  transaction: defaultDbTransaction
                }
              )
              .catch(err => {
                console.log(
                  "Error while updating return quantity in consultation",
                  err
                );
                throw new createError.InternalServerError(
                  Constants.SOMETHING_ERROR_OCCURRED
                );
              });
          } else if (type == "Treatment") {
            await treatmentAppointmentLineBillsAssociations
              .update(
                {
                  returnQuantity: 1
                },
                {
                  where: {
                    id: refId
                  },
                  transaction: defaultDbTransaction
                }
              )
              .catch(err => {
                console.log(
                  "Error while updating return quantity in treatment",
                  err
                );
                throw new createError.InternalServerError(
                  Constants.SOMETHING_ERROR_OCCURRED
                );
              });
          }
        })
      );

      await PatientPurchaseReturnsModel.create(
        {
          patientId,
          orderId,
          returnedDate: moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss"),
          type: type,
          returnDetails: JSON.stringify(returnInformation?.returnDetails),
          totalAmount
        },
        {
          trasaction: defaultDbTransaction
        }
      ).catch(err => {
        console.log("Error while inserting new row in returns table", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await defaultDbTransaction.commit();
    } catch (err) {
      await defaultDbTransaction.rollback();
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }

    return Constants.DATA_UPDATED_SUCCESS;
  }
}

module.exports = PaymentService;
