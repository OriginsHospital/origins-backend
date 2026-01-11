const Constants = require("../constants/constants");
const TeamsService = require("../services/teamsService");

class TeamsController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new TeamsService(this._request, this._response, this._next);
  }

  // ============ CHAT Handlers ============

  async getUserChatsHandler() {
    const data = await this._service.getUserChatsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createChatHandler() {
    const data = await this._service.createChatService();
    this._response.status(201).send({
      status: 201,
      message: "Chat created successfully",
      data: data
    });
  }

  async getChatMessagesHandler() {
    const data = await this._service.getChatMessagesService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async sendMessageHandler() {
    const data = await this._service.sendMessageService();
    this._response.status(201).send({
      status: 201,
      message: "Message sent successfully",
      data: data
    });
  }

  async editMessageHandler() {
    const data = await this._service.editMessageService();
    this._response.status(200).send({
      status: 200,
      message: "Message updated successfully",
      data: data
    });
  }

  async deleteMessageHandler() {
    const data = await this._service.deleteMessageService();
    this._response.status(200).send({
      status: 200,
      message: "Message deleted successfully",
      data: data
    });
  }

  async addChatMembersHandler() {
    const data = await this._service.addChatMembersService();
    this._response.status(200).send({
      status: 200,
      message: "Members added successfully",
      data: data
    });
  }

  async updateChatHandler() {
    const data = await this._service.updateChatService();
    this._response.status(200).send({
      status: 200,
      message: "Chat updated successfully",
      data: data
    });
  }

  async removeChatMemberHandler() {
    const data = await this._service.removeChatMemberService();
    this._response.status(200).send({
      status: 200,
      message: "Member removed successfully",
      data: data
    });
  }

  // ============ MEETING Handlers ============

  async getUserMeetingsHandler() {
    const data = await this._service.getUserMeetingsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createMeetingHandler() {
    const data = await this._service.createMeetingService();
    this._response.status(201).send({
      status: 201,
      message: "Meeting created successfully",
      data: data
    });
  }

  async updateMeetingHandler() {
    const data = await this._service.updateMeetingService();
    this._response.status(200).send({
      status: 200,
      message: "Meeting updated successfully",
      data: data
    });
  }

  async joinMeetingHandler() {
    const data = await this._service.joinMeetingService();
    this._response.status(200).send({
      status: 200,
      message: "Meeting joined successfully",
      data: data
    });
  }

  async deleteMeetingHandler() {
    const data = await this._service.deleteMeetingService();
    this._response.status(200).send({
      status: 200,
      message: "Meeting deleted successfully",
      data: data
    });
  }

  // ============ CALENDAR EVENT Handlers ============

  async getCalendarEventsHandler() {
    const data = await this._service.getCalendarEventsService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createCalendarEventHandler() {
    const data = await this._service.createCalendarEventService();
    this._response.status(201).send({
      status: 201,
      message: "Calendar event created successfully",
      data: data
    });
  }

  async updateCalendarEventHandler() {
    const data = await this._service.updateCalendarEventService();
    this._response.status(200).send({
      status: 200,
      message: "Calendar event updated successfully",
      data: data
    });
  }

  async deleteCalendarEventHandler() {
    const data = await this._service.deleteCalendarEventService();
    this._response.status(200).send({
      status: 200,
      message: "Calendar event deleted successfully",
      data: data
    });
  }

  // ============ SCHEDULE Handlers ============

  async getSchedulesHandler() {
    const data = await this._service.getSchedulesService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createScheduleHandler() {
    const data = await this._service.createScheduleService();
    this._response.status(201).send({
      status: 201,
      message: "Schedule created successfully",
      data: data
    });
  }

  async updateScheduleHandler() {
    const data = await this._service.updateScheduleService();
    this._response.status(200).send({
      status: 200,
      message: "Schedule updated successfully",
      data: data
    });
  }

  async deleteScheduleHandler() {
    const data = await this._service.deleteScheduleService();
    this._response.status(200).send({
      status: 200,
      message: "Schedule deleted successfully",
      data: data
    });
  }

  // ============ CALL Handlers ============

  async initiateCallHandler() {
    const data = await this._service.initiateCallService();
    this._response.status(201).send({
      status: 201,
      message: "Call initiated successfully",
      data: data
    });
  }

  async updateCallStatusHandler() {
    const data = await this._service.updateCallStatusService();
    this._response.status(200).send({
      status: 200,
      message: "Call status updated successfully",
      data: data
    });
  }

  async getCallHistoryHandler() {
    const data = await this._service.getCallHistoryService();
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = TeamsController;
