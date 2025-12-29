const Constants = require("../constants/constants");
const TicketsService = require("../services/ticketsService");

class TicketsController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new TicketsService(
      this._request,
      this._response,
      this._next
    );
  }

  async getTicketsRouteHandler() {
    const data = await this._service.getTicketsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getTicketDetailsRouteHandler() {
    const data = await this._service.getTicketDetailsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createTicketRouteHandler() {
    const data = await this._service.createTicketService();
    this._response.status(201).send({
      status: 201,
      message: "Ticket created successfully",
      data: data
    });
  }

  async updateTicketRouteHandler() {
    const data = await this._service.updateTicketService();
    this._response.status(200).send({
      status: 200,
      message: Constants.DATA_UPDATED_SUCCESS,
      data: data
    });
  }

  async updateTicketStatusRouteHandler() {
    const data = await this._service.updateTicketStatusService();
    this._response.status(200).send({
      status: 200,
      message: "Ticket status updated successfully",
      data: data
    });
  }

  async deleteTicketRouteHandler() {
    const data = await this._service.deleteTicketService();
    this._response.status(200).send({
      status: 200,
      message: data,
      data: null
    });
  }

  async createTicketCommentRouteHandler() {
    const data = await this._service.createTicketCommentService();
    this._response.status(201).send({
      status: 201,
      message: "Comment added successfully",
      data: data
    });
  }

  async getActiveStaffRouteHandler() {
    const data = await this._service.getActiveStaffService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = TicketsController;
