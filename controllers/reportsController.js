const ReportsService = require("../services/reportsService");
const RevenueNewEntryService = require("../services/revenueNewEntryService");
const Constants = require("../constants/constants");

class ReportsController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new ReportsService(
      this._request,
      this._response,
      this._next
    );
  }

  async getStageDurationReportHandler() {
    const data = await this._service.getStageDurationReportService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getGrnVendorPaymentsHandler() {
    const data = await this._service.getGrnVendorPaymentService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPurchasePrescribedHandler() {
    const data = await this._service.getPurchasePrescribedService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getStockExpiryReportHandler() {
    const data = await this._service.getStockExpiryService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getSalesReportHandler() {
    const data = await this._service.getSalesReportService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPatientPharmacySalesReportHandler() {
    const data = await this._service.getPatientPharmacySalesReportService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getPharmacySalesDetailedReportHandler() {
    const data = await this._service.getPharmacySalesDetailedReportService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getGrnSalesReportHandler() {
    const data = await this._service.getGrnSalesReportService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getStockReportHandler() {
    const data = await this._service.getStockReportService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getGrnStockReportTabHandler() {
    const data = await this._service.getGrnStockReportTabService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getItemPurchaseHistoryReport() {
    const data = await this._service.getItemPurchaseHistoryReportService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async noShowReportHandler() {
    const data = await this._service.noShowReportService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async treatmentCyclesPaymentsReportHandler() {
    const data = await this._service.treatmentCyclesPaymentsReportService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async treatmentCyclesReportHandler() {
    const data = await this._service.treatmentCyclesReportService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async vendorManufacturerDepartmentReportHandler() {
    const data = await this._service.vendorManufacturerDepartmentReportService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateRevenueNewEntryHandler() {
    const entryService = new RevenueNewEntryService(this._request);
    const data = await entryService.updateEntry();
    this._response.status(200).send({
      status: 200,
      message: "Payment record updated successfully",
      data: data
    });
  }

  async deleteRevenueNewEntryHandler() {
    const entryService = new RevenueNewEntryService(this._request);
    const data = await entryService.deleteEntry();
    this._response.status(200).send({
      status: 200,
      message: data.message || "Payment record deleted successfully",
      data: data
    });
  }
}

module.exports = ReportsController;
