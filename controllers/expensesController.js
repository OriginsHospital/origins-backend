const ExpensesService = require("../services/expenseService");
const Constants = require("../constants/constants");

class ExpensesController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new ExpensesService(
      this._request,
      this._response,
      this._service
    );
  }

  async saveExpensesHandler() {
    const data = await this._service.saveExpensesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editExpenseHandler() {
    const data = await this._service.editExpenseService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAllExpensesHandler() {
    const data = await this._service.getAllExpensesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getExpenseDetailsByIdHandler() {
    const data = await this._service.getExpenseDetailsByIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteReceiptHandler() {
    const data = await this._service.deleteReceiptService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getSubCategoryByCategoryIdHandler() {
    const data = await this._service.getSubCategoryByCategoryIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveSubCategoryHandler() {
    const data = await this._service.saveSubCategoryService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editSubCategoryHandler() {
    const data = await this._service.editSubCategoryService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteSubCategoryHandler() {
    const data = await this._service.deleteSubCategoryService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = ExpensesController;
