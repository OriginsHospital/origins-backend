const OrderService = require("../services/orderService");
const Constants = require("../constants/constants");

class OrderController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new OrderService(this._request, this._response, this._next);
  }

  async getAllOrdersHandler() {
    const data = await this._service.getAllOrdersService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createOrderHandler() {
    const data = await this._service.createOrderService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async placeOrderHandler() {
    const data = await this._service.placeOrderService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async receiveOrderHandler() {
    const data = await this._service.receiveOrderService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async paidOrderHandler() {
    const data = await this._service.paidOrderService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = OrderController;
