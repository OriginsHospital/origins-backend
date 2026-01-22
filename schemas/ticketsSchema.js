const Joi = require("@hapi/joi");

const createTicketSchema = Joi.object({
  taskDescription: Joi.string()
    .min(10)
    .required()
    .messages({
      "string.min": "Task description must be at least 10 characters long",
      "any.required": "Task description is required"
    }),
  assignedTo: Joi.number()
    .integer()
    .required()
    .messages({
      "any.required": "Please assign the ticket to a staff member"
    }),
  priority: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH")
    .default("MEDIUM")
    .messages({
      "any.only": "Priority must be LOW, MEDIUM, or HIGH"
    }),
  department: Joi.string()
    .max(100)
    .required()
    .messages({
      "any.required": "Department is required",
      "string.max": "Department must not exceed 100 characters"
    }),
  category: Joi.string()
    .max(100)
    .allow(null, "")
    .optional(),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional()
    .default([])
});

const updateTicketSchema = Joi.object({
  ticketId: Joi.number()
    .integer()
    .required(),
  taskDescription: Joi.string()
    .min(10)
    .optional(),
  assignedTo: Joi.number()
    .integer()
    .optional(),
  priority: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH")
    .optional(),
  department: Joi.string()
    .max(100)
    .optional(),
  category: Joi.string()
    .max(100)
    .allow(null, "")
    .optional(),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional()
});

const updateTicketStatusSchema = Joi.object({
  ticketId: Joi.number()
    .integer()
    .required(),
  status: Joi.string()
    .valid("OPEN", "IN_PROGRESS", "COMPLETED")
    .required()
    .messages({
      "any.only": "Status must be OPEN, IN_PROGRESS, or COMPLETED"
    })
});

const createTicketCommentSchema = Joi.object({
  ticketId: Joi.number()
    .integer()
    .required(),
  commentText: Joi.string()
    .min(1)
    .required()
    .messages({
      "any.required": "Comment text is required"
    })
});

const getTicketsQuerySchema = Joi.object({
  status: Joi.string()
    .valid("OPEN", "IN_PROGRESS", "COMPLETED")
    .optional(),
  priority: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH")
    .optional(),
  assignedTo: Joi.number()
    .integer()
    .optional(),
  search: Joi.string().optional(),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
});

module.exports = {
  createTicketSchema,
  updateTicketSchema,
  updateTicketStatusSchema,
  createTicketCommentSchema,
  getTicketsQuerySchema
};
