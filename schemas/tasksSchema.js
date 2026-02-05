const Joi = require("@hapi/joi");

const createTaskSchema = Joi.object({
  taskName: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      "any.required": "Task name is required",
      "string.max": "Task name must not exceed 255 characters"
    }),
  description: Joi.string()
    .max(1000)
    .allow(null, "")
    .optional(),
  pendingOn: Joi.string()
    .max(255)
    .allow(null, "")
    .optional(),
  remarks: Joi.string()
    .max(1000)
    .allow(null, "")
    .optional(),
  status: Joi.string()
    .valid("Pending", "In Progress", "Completed", "Cancelled")
    .default("Pending")
    .messages({
      "any.only": "Status must be Pending, In Progress, Completed, or Cancelled"
    }),
  startDate: Joi.date()
    .allow(null, "")
    .optional(),
  endDate: Joi.date()
    .allow(null, "")
    .optional(),
  alertEnabled: Joi.boolean()
    .default(false)
    .optional(),
  alertDate: Joi.date()
    .allow(null, "")
    .optional(),
  assignedTo: Joi.alternatives()
    .try(
      Joi.number()
        .integer()
        .allow(null),
      Joi.array()
        .items(Joi.number().integer())
        .min(1)
    )
    .optional(),
  department: Joi.string()
    .max(100)
    .allow(null, "")
    .optional(),
  category: Joi.string()
    .max(100)
    .allow(null, "")
    .optional()
});

const updateTaskSchema = Joi.object({
  taskId: Joi.number()
    .integer()
    .required(),
  taskName: Joi.string()
    .min(1)
    .max(255)
    .optional(),
  description: Joi.string()
    .max(1000)
    .allow(null, "")
    .optional(),
  pendingOn: Joi.string()
    .max(255)
    .allow(null, "")
    .optional(),
  remarks: Joi.string()
    .max(1000)
    .allow(null, "")
    .optional(),
  status: Joi.string()
    .valid("Pending", "In Progress", "Completed", "Cancelled")
    .optional(),
  startDate: Joi.date()
    .allow(null, "")
    .optional(),
  endDate: Joi.date()
    .allow(null, "")
    .optional(),
  alertEnabled: Joi.boolean().optional(),
  alertDate: Joi.date()
    .allow(null, "")
    .optional(),
  assignedTo: Joi.alternatives()
    .try(
      Joi.number()
        .integer()
        .allow(null),
      Joi.array()
        .items(Joi.number().integer())
        .min(1)
    )
    .optional(),
  department: Joi.string()
    .max(100)
    .allow(null, "")
    .optional(),
  category: Joi.string()
    .max(100)
    .allow(null, "")
    .optional()
});

const updateTaskStatusSchema = Joi.object({
  taskId: Joi.number()
    .integer()
    .required(),
  status: Joi.string()
    .valid("Pending", "In Progress", "Completed", "Cancelled")
    .required()
    .messages({
      "any.only": "Status must be Pending, In Progress, Completed, or Cancelled"
    })
});

const getTasksQuerySchema = Joi.object({
  status: Joi.string()
    .valid("Pending", "In Progress", "Completed", "Cancelled")
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
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  getTasksQuerySchema
};
