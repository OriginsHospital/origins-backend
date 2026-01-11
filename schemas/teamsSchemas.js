const Joi = require("@hapi/joi");

// ============ CHAT Schemas ============

const createChatSchema = Joi.object({
  chatType: Joi.string()
    .valid("direct", "group")
    .required(),
  name: Joi.string()
    .max(255)
    .optional()
    .allow(null)
    .allow(""),
  description: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  memberIds: Joi.array()
    .items(Joi.number().integer())
    .min(1)
    .required()
});

const addChatMembersSchema = Joi.object({
  memberIds: Joi.array()
    .items(Joi.number().integer())
    .min(1)
    .required()
});

const updateChatSchema = Joi.object({
  name: Joi.string()
    .max(255)
    .optional()
    .allow(null)
    .allow(""),
  description: Joi.string()
    .optional()
    .allow(null)
    .allow("")
});

// ============ MESSAGE Schemas ============

const sendMessageSchema = Joi.object({
  message: Joi.string()
    .optional()
    .allow("")
    .allow(null),
  messageType: Joi.string()
    .valid("text", "file", "image", "video", "audio")
    .optional()
    .default("text"),
  fileUrl: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  fileName: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  fileSize: Joi.number()
    .integer()
    .optional()
    .allow(null),
  replyToMessageId: Joi.number()
    .integer()
    .optional()
    .allow(null),
  mentions: Joi.array()
    .items(Joi.number().integer())
    .optional()
    .allow(null)
});

const editMessageSchema = Joi.object({
  message: Joi.string().required()
});

// ============ MEETING Schemas ============

const createMeetingSchema = Joi.object({
  title: Joi.string()
    .max(255)
    .required(),
  description: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  startTime: Joi.date().required(),
  endTime: Joi.date()
    .optional()
    .allow(null),
  agenda: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  location: Joi.string()
    .max(255)
    .optional()
    .allow(null)
    .allow(""),
  meetingType: Joi.string()
    .valid("scheduled", "instant", "recurring")
    .optional()
    .default("scheduled"),
  participantIds: Joi.array()
    .items(Joi.number().integer())
    .optional()
    .default([])
});

const updateMeetingSchema = Joi.object({
  title: Joi.string()
    .max(255)
    .optional(),
  description: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  startTime: Joi.date().optional(),
  endTime: Joi.date()
    .optional()
    .allow(null),
  agenda: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  location: Joi.string()
    .max(255)
    .optional()
    .allow(null)
    .allow(""),
  status: Joi.string()
    .valid("scheduled", "ongoing", "completed", "cancelled")
    .optional(),
  participantIds: Joi.array()
    .items(Joi.number().integer())
    .optional()
});

// ============ CALENDAR EVENT Schemas ============

const createCalendarEventSchema = Joi.object({
  title: Joi.string()
    .max(255)
    .required(),
  description: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  eventType: Joi.string()
    .valid("meeting", "task", "reminder", "shift", "appointment")
    .optional()
    .default("meeting"),
  startTime: Joi.date().required(),
  endTime: Joi.date()
    .optional()
    .allow(null),
  location: Joi.string()
    .max(255)
    .optional()
    .allow(null)
    .allow(""),
  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .optional()
    .default("medium"),
  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .default("#1976d2"),
  isAllDay: Joi.boolean()
    .optional()
    .default(false)
});

const updateCalendarEventSchema = Joi.object({
  title: Joi.string()
    .max(255)
    .optional(),
  description: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  eventType: Joi.string()
    .valid("meeting", "task", "reminder", "shift", "appointment")
    .optional(),
  startTime: Joi.date().optional(),
  endTime: Joi.date()
    .optional()
    .allow(null),
  location: Joi.string()
    .max(255)
    .optional()
    .allow(null)
    .allow(""),
  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .optional(),
  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  isAllDay: Joi.boolean().optional()
});

// ============ SCHEDULE Schemas ============

const createScheduleSchema = Joi.object({
  title: Joi.string()
    .max(255)
    .required(),
  description: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  scheduleType: Joi.string()
    .valid("shift", "task", "rotation")
    .optional()
    .default("shift"),
  startTime: Joi.date().required(),
  endTime: Joi.date().required(),
  assignedTo: Joi.number()
    .integer()
    .optional()
    .allow(null),
  departmentId: Joi.number()
    .integer()
    .optional()
    .allow(null),
  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .optional()
    .default("medium")
});

const updateScheduleSchema = Joi.object({
  title: Joi.string()
    .max(255)
    .optional(),
  description: Joi.string()
    .optional()
    .allow(null)
    .allow(""),
  scheduleType: Joi.string()
    .valid("shift", "task", "rotation")
    .optional(),
  startTime: Joi.date().optional(),
  endTime: Joi.date().optional(),
  assignedTo: Joi.number()
    .integer()
    .optional()
    .allow(null),
  departmentId: Joi.number()
    .integer()
    .optional()
    .allow(null),
  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .optional(),
  status: Joi.string()
    .valid("pending", "in-progress", "completed", "cancelled")
    .optional()
});

// ============ CALL Schemas ============

const initiateCallSchema = Joi.object({
  callType: Joi.string()
    .valid("voice", "video")
    .optional()
    .default("voice"),
  chatId: Joi.number()
    .integer()
    .optional()
    .allow(null),
  receiverId: Joi.number()
    .integer()
    .required()
});

const updateCallStatusSchema = Joi.object({
  callStatus: Joi.string()
    .valid(
      "initiated",
      "ringing",
      "answered",
      "rejected",
      "missed",
      "ended",
      "failed"
    )
    .required(),
  duration: Joi.number()
    .integer()
    .optional()
    .allow(null)
});

module.exports = {
  createChatSchema,
  addChatMembersSchema,
  updateChatSchema,
  sendMessageSchema,
  editMessageSchema,
  createMeetingSchema,
  updateMeetingSchema,
  createCalendarEventSchema,
  updateCalendarEventSchema,
  createScheduleSchema,
  updateScheduleSchema,
  initiateCallSchema,
  updateCallStatusSchema
};
