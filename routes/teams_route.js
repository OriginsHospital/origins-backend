const express = require("express");
const TeamsController = require("../controllers/teamsController.js");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const multer = require("multer");
const upload = multer();

class TeamsRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  intializeRoutes() {
    // ============ CHAT Routes ============
    
    this._route.get(
      "/chats",
      checkActiveSession,
      tokenVerified,
      this.getUserChatsRoute
    );

    this._route.post(
      "/chats",
      checkActiveSession,
      tokenVerified,
      this.createChatRoute
    );

    this._route.get(
      "/chats/:chatId/messages",
      checkActiveSession,
      tokenVerified,
      this.getChatMessagesRoute
    );

    this._route.post(
      "/chats/:chatId/messages",
      checkActiveSession,
      tokenVerified,
      upload.fields([{ name: "file", maxCount: 1 }]),
      this.sendMessageRoute
    );

    this._route.put(
      "/chats/:chatId/messages/:messageId",
      checkActiveSession,
      tokenVerified,
      this.editMessageRoute
    );

    this._route.delete(
      "/chats/:chatId/messages/:messageId",
      checkActiveSession,
      tokenVerified,
      this.deleteMessageRoute
    );

    this._route.put(
      "/chats/:chatId",
      checkActiveSession,
      tokenVerified,
      this.updateChatRoute
    );

    this._route.post(
      "/chats/:chatId/members",
      checkActiveSession,
      tokenVerified,
      this.addChatMembersRoute
    );

    this._route.delete(
      "/chats/:chatId/members/:memberId",
      checkActiveSession,
      tokenVerified,
      this.removeChatMemberRoute
    );

    // ============ MEETING Routes ============

    this._route.get(
      "/meetings",
      checkActiveSession,
      tokenVerified,
      this.getUserMeetingsRoute
    );

    this._route.post(
      "/meetings",
      checkActiveSession,
      tokenVerified,
      this.createMeetingRoute
    );

    this._route.put(
      "/meetings/:meetingId",
      checkActiveSession,
      tokenVerified,
      this.updateMeetingRoute
    );

    this._route.post(
      "/meetings/:meetingId/join",
      checkActiveSession,
      tokenVerified,
      this.joinMeetingRoute
    );

    this._route.delete(
      "/meetings/:meetingId",
      checkActiveSession,
      tokenVerified,
      this.deleteMeetingRoute
    );

    // ============ CALENDAR EVENT Routes ============

    this._route.get(
      "/calendar/events",
      checkActiveSession,
      tokenVerified,
      this.getCalendarEventsRoute
    );

    this._route.post(
      "/calendar/events",
      checkActiveSession,
      tokenVerified,
      this.createCalendarEventRoute
    );

    this._route.put(
      "/calendar/events/:eventId",
      checkActiveSession,
      tokenVerified,
      this.updateCalendarEventRoute
    );

    this._route.delete(
      "/calendar/events/:eventId",
      checkActiveSession,
      tokenVerified,
      this.deleteCalendarEventRoute
    );

    // ============ SCHEDULE Routes ============

    this._route.get(
      "/scheduling",
      checkActiveSession,
      tokenVerified,
      this.getSchedulesRoute
    );

    this._route.post(
      "/scheduling",
      checkActiveSession,
      tokenVerified,
      this.createScheduleRoute
    );

    this._route.put(
      "/scheduling/:scheduleId",
      checkActiveSession,
      tokenVerified,
      this.updateScheduleRoute
    );

    this._route.delete(
      "/scheduling/:scheduleId",
      checkActiveSession,
      tokenVerified,
      this.deleteScheduleRoute
    );

    // ============ CALL Routes ============

    this._route.post(
      "/calls",
      checkActiveSession,
      tokenVerified,
      this.initiateCallRoute
    );

    this._route.put(
      "/calls/:callId/status",
      checkActiveSession,
      tokenVerified,
      this.updateCallStatusRoute
    );

    this._route.get(
      "/calls/history",
      checkActiveSession,
      tokenVerified,
      this.getCallHistoryRoute
    );
  }

  // ============ CHAT Route Handlers ============

  getUserChatsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.getUserChatsHandler();
  });

  createChatRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.createChatHandler();
  });

  getChatMessagesRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.getChatMessagesHandler();
  });

  sendMessageRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.sendMessageHandler();
  });

  editMessageRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.editMessageHandler();
  });

  deleteMessageRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.deleteMessageHandler();
  });

  addChatMembersRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.addChatMembersHandler();
  });

  updateChatRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.updateChatHandler();
  });

  removeChatMemberRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.removeChatMemberHandler();
  });

  // ============ MEETING Route Handlers ============

  getUserMeetingsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.getUserMeetingsHandler();
  });

  createMeetingRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.createMeetingHandler();
  });

  updateMeetingRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.updateMeetingHandler();
  });

  joinMeetingRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.joinMeetingHandler();
  });

  deleteMeetingRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.deleteMeetingHandler();
  });

  // ============ CALENDAR EVENT Route Handlers ============

  getCalendarEventsRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.getCalendarEventsHandler();
  });

  createCalendarEventRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.createCalendarEventHandler();
  });

  updateCalendarEventRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.updateCalendarEventHandler();
  });

  deleteCalendarEventRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.deleteCalendarEventHandler();
  });

  // ============ SCHEDULE Route Handlers ============

  getSchedulesRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.getSchedulesHandler();
  });

  createScheduleRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.createScheduleHandler();
  });

  updateScheduleRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.updateScheduleHandler();
  });

  deleteScheduleRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.deleteScheduleHandler();
  });

  // ============ CALL Route Handlers ============

  initiateCallRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.initiateCallHandler();
  });

  updateCallStatusRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.updateCallStatusHandler();
  });

  getCallHistoryRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new TeamsController(req, res, next);
    await controllerObj.getCallHistoryHandler();
  });
}

module.exports = TeamsRoute;

