const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const Constants = require("../constants/constants");
const reportLabelMapping = require("../constants/reportConstants");
const AppointmentsPaymentService = require("../services/appointmentPaymentsService");
const {
  appointmentStageDurationReportQuery,
  grnVendorPaymentReportsQuery,
  prescribedPurchaseReportQuery,
  stockExpiryReportQuery,
  salesReportQuery,
  salesDataQuery,
  returnsDataQuery,
  patientPharmacySalesReportQuery,
  grnSalesReportQuery,
  getStockReportQuery,
  getItemPurchaseHistoryQuery,
  noShowReportQuery,
  treatmentCycleHistoryQuery
} = require("../queries/reports_queries");
const { Sequelize } = require("sequelize");
const lodash = require("lodash");

class ReportsService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mySqlConnection = MySqlConnection._instance;
    this.appointmentPaymentServiceObj = new AppointmentsPaymentService(
      request,
      response,
      next
    );
  }

  async getStageDurationReportService() {
    const { fromDate, toDate, branchId } = this._request.query;
    let whereConditionsCombined = "";
    let stageDurationReportQuery = appointmentStageDurationReportQuery;

    let whereConditions = [];
    if (fromDate) {
      whereConditions.push("CAST(appointmentDate  AS DATE) >= :fromDate");
    }
    if (toDate) {
      whereConditions.push("CAST(appointmentDate  AS DATE) <= :toDate");
    }
    if (branchId) {
      whereConditions.push("branchId = :branchId");
    }
    if (whereConditions.length > 0) {
      whereConditionsCombined = ` WHERE ` + whereConditions.join(" AND ");
    }
    whereConditionsCombined += ` order by appointmentDate  desc `;

    // Replacing manually because, Sequelize replace will not work
    stageDurationReportQuery = stageDurationReportQuery.replaceAll(
      "{{whereCondition}}",
      whereConditionsCombined
    );

    let data = await this.mySqlConnection
      .query(stageDurationReportQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          toDate: toDate,
          fromDate: fromDate,
          branchId: branchId
        }
      })
      .catch(err => {
        console.log("Error while fetching  stage Duration Report", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      const reportData = data[0]?.stageDurationReport;

      // Process stageReportDetails durations
      if (reportData?.stageReportDetails) {
        const conversionKeys = [
          "scanStageDuration",
          "doctorStageDuration",
          "seenStageDuration"
        ];

        reportData.stageReportDetails.forEach(element => {
          conversionKeys.forEach(key => {
            if (
              element.hasOwnProperty(key) &&
              element[key] != "NA" &&
              element[key] != "No Show" &&
              element[key] !== null
            ) {
              const duration = +element[key];
              if (duration > 59) {
                element[key] = `${Math.floor(duration / 60)} h ${duration %
                  60} min`;
              } else if (!isNaN(duration)) {
                element[key] = `${duration} min`;
              }
            }
          });
        });
      }
      return reportData;
    }
    return {};
  }

  async getGrnVendorPaymentService() {
    let data = await this.mySqlConnection
      .query(grnVendorPaymentReportsQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching GRN Vendor Payment Report", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return data;
  }

  async getPurchasePrescribedService() {
    return await this.mySqlConnection
      .query(prescribedPurchaseReportQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching prescribed Purchase Report", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async getStockExpiryService() {
    return await this.mySqlConnection
      .query(stockExpiryReportQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching prescribed Purchase Report", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async getSalesReportService() {
    const { fromDate, toDate, branchId } = this._request.query;
    if (lodash.isEmpty(fromDate?.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "fromDate")
      );
    }
    if (lodash.isEmpty(toDate?.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "toDate")
      );
    }

    if (lodash.isEmpty(branchId?.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "branchId")
      );
    }

    let salesDashboard = await this.mySqlConnection
      .query(salesReportQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          fromDate: fromDate,
          toDate: toDate,
          branchId: branchId
        }
      })
      .catch(err => {
        console.log("Error while getting data of sales data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    if (!lodash.isEmpty(salesDashboard)) {
      salesDashboard = salesDashboard[0];

      // For managing Labels
      const matchedItems = salesDashboard?.totalSalesProductTypeWise
        ?.map(item => ({
          ...item,
          normalizedType: item.productType.replace(/\s+/g, "").toLowerCase()
        }))
        .filter(item => reportLabelMapping.hasOwnProperty(item.normalizedType))
        .map(item => ({
          amount: item.amount,
          productType: reportLabelMapping[item.normalizedType]
        }));

      // For unmatched items
      const allItems = Object.entries(reportLabelMapping)
        .map(([key, label]) => {
          const matchedItem = matchedItems?.find(
            item => item.productType === label
          );
          return {
            amount: matchedItem ? matchedItem.amount : 0,
            productType: label
          };
        })
        .sort((a, b) => b.amount - a.amount);

      salesDashboard = {
        ...salesDashboard,
        totalSalesProductTypeWise: allItems
      };
    }

    let salesData = await this.mySqlConnection
      .query(salesDataQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          fromDate: fromDate,
          toDate: toDate,
          branchId: branchId
        }
      })
      .catch(err => {
        console.log("Error while getting data for sales data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    if (!lodash.isEmpty(salesData)) {
      salesData = salesData.map(data => data.orderDetails);
    }

    let returnsData = await this.mySqlConnection
      .query(returnsDataQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          fromDate: fromDate,
          toDate: toDate,
          branchId: branchId
        }
      })
      .catch(err => {
        console.log("Error while getting data for returns data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    if (!lodash.isEmpty(returnsData)) {
      returnsData = returnsData.map(data => data.orderDetails);
    }

    let response = {};
    response["salesDashboard"] = salesDashboard;
    response["salesData"] = salesData;
    response["returnData"] = returnsData;

    return response;
  }

  async getPatientPharmacySalesReportService() {
    return await this.mySqlConnection
      .query(patientPharmacySalesReportQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching Patient Pharmacy sales Report", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async getGrnSalesReportService() {
    return await this.mySqlConnection
      .query(grnSalesReportQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching GRN Sales Report", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async getStockReportService() {
    const { branchId } = this._request.query;
    const currentUserBranchId = this._request.userDetails.branchDetails.map(
      branch => {
        return branch.id;
      }
    );
    return await this.mySqlConnection
      .query(getStockReportQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          branchId:
            branchId || currentUserBranchId.map(branch => String(branch))
        }
      })
      .catch(err => {
        console.log("Error while fetching Pharmacy Stock Report", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async getItemPurchaseHistoryReportService() {
    const { itemId } = this._request.params;
    if (lodash.isEmpty(itemId?.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "item id")
      );
    }
    const data = await this.mySqlConnection
      .query(getItemPurchaseHistoryQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          itemId: itemId
        }
      })
      .catch(err => {
        console.log("Error while fetching item purchase report query", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async noShowReportService() {
    const data = await this.mySqlConnection
      .query(noShowReportQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching no show report query", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async treatmentCyclesReportService() {
    // Same Payments Report only but show each milestone in individual rows.

    const { fromDate, toDate, branchId, searchQuery } = this._request.query;
    if (lodash.isEmpty(fromDate?.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "From Date")
      );
    }
    if (lodash.isEmpty(toDate?.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "To Date")
      );
    }
    if (lodash.isEmpty(branchId?.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Branch Name")
      );
    }

    let query = treatmentCycleHistoryQuery;

    let whereConditions = [];
    if (fromDate) {
      whereConditions.push(
        "COALESCE(vpa.registrationDate,'1000-12-31') >= :fromDate"
      );
    }
    if (toDate) {
      whereConditions.push(
        "COALESCE(vpa.registrationDate,'9999-12-31') <= :toDate"
      );
    }
    if (branchId) {
      whereConditions.push("pm.branchId = :branchId");
    }
    if (searchQuery) {
      whereConditions.push(
        "(pm.firstName LIKE :searchQuery or pm.lastName LIKE :searchQuery)"
      );
    }
    whereConditions.push(` (pm.firstName != 'test' or pm.lastName != 'test')`);
    if (whereConditions.length > 0) {
      query += ` WHERE ` + whereConditions.join(" AND ");
    }

    let data = await this.mySqlConnection.query(query, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: {
        fromDate: fromDate,
        toDate: toDate,
        branchId: branchId,
        searchQuery: searchQuery ? `%${searchQuery.trim()}%` : null
      }
    });

    if (lodash.isEmpty(data)) {
      return [];
    }

    // providing data of Milestone with package and without packages
    await Promise.all(
      data.map(async each => {
        if (each?.isPackageExists == 1) {
          let pendingAmountDetails = await this.appointmentPaymentServiceObj.getPendingPaymentAmountForPackageService(
            each?.visitId
          );
          each["pendingAmountDetails"] = pendingAmountDetails || null;
        } else {
          let pendingAmountDetails = await this.appointmentPaymentServiceObj.getPendingPaymentWithoutPackageService(
            each?.visitId
          );
          each["pendingAmountDetails"] = pendingAmountDetails || null;
        }
        return each;
      })
    );

    if (lodash.isEmpty(data)) {
      return [];
    }
    // Each patient each milestone one row
    const transformedData = data.flatMap(patient => {
      return patient?.pendingAmountDetails.map(detail => ({
        patientId: patient?.patientId,
        patientName: patient?.patientName,
        spouseName: patient?.spouseName,
        treatmentType: patient?.treatmentType,
        visitType: patient?.visitType,
        milestoneType: detail?.productTypeEnum,
        mileStoneStartedDate: detail?.mileStoneStartedDate,
        totalAmount: detail?.totalAmount,
        paidAmount: detail?.totalPaid,
        pendingAmount: detail?.pending_amount,
        visitId: patient.visitId
      }));
    });
    return transformedData;
  }

  async treatmentCyclesPaymentsReportService() {
    const { fromDate, toDate, branchId, searchQuery } = this._request.query;
    if (lodash.isEmpty(fromDate?.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "From Date")
      );
    }
    if (lodash.isEmpty(toDate?.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "To Date")
      );
    }
    if (lodash.isEmpty(branchId?.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Branch Name")
      );
    }

    let query = treatmentCycleHistoryQuery;

    let whereConditions = [];
    if (fromDate) {
      whereConditions.push(
        "COALESCE(vpa.registrationDate,'1000-12-31') >= :fromDate"
      );
    }
    if (toDate) {
      whereConditions.push(
        "COALESCE(vpa.registrationDate,'9999-12-31') <= :toDate"
      );
    }
    if (branchId) {
      whereConditions.push("pm.branchId = :branchId");
    }
    if (searchQuery) {
      whereConditions.push(
        "(pm.firstName LIKE :searchQuery or pm.lastName LIKE :searchQuery)"
      );
    }
    whereConditions.push(` (pm.firstName != 'test' or pm.lastName != 'test')`);
    if (whereConditions.length > 0) {
      query += ` WHERE ` + whereConditions.join(" AND ");
    }

    let data = await this.mySqlConnection.query(query, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: {
        fromDate: fromDate,
        toDate: toDate,
        branchId: branchId,
        searchQuery: searchQuery ? `%${searchQuery.trim()}%` : null
      }
    });

    if (lodash.isEmpty(data)) {
      return [];
    }

    // providing data of Milestone with package and without packages
    await Promise.all(
      data.map(async each => {
        if (each?.isPackageExists == 1) {
          let pendingAmountDetails = await this.appointmentPaymentServiceObj.getPendingPaymentAmountForPackageService(
            each?.visitId
          );
          each["pendingAmountDetails"] = pendingAmountDetails || null;
        } else {
          let pendingAmountDetails = await this.appointmentPaymentServiceObj.getPendingPaymentWithoutPackageService(
            each?.visitId
          );
          each["pendingAmountDetails"] = pendingAmountDetails || null;
        }
        return each;
      })
    );
    return data;
  }
}

module.exports = ReportsService;
