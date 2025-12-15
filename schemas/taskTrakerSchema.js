const Joi = require("@hapi/joi");

const createTasksSchema = Joi.object({
  branchId: Joi.number()
    .integer()
    .required(),
  departmentId: Joi.number()
    .integer()
    .required(),
  assignedBy: Joi.number()
    .integer()
    .required(),
  assignedTo: Joi.number()
    .integer()
    .required(),
  assignedDate: Joi.date().required(),
  dueDate: Joi.date().required(),
  description: Joi.string().required()
});

const createTaskCommentsSchema = Joi.object({
  taskId: Joi.number()
    .integer()
    .required(),
  commentText: Joi.string().required()
});

const editTaskSchema = Joi.object({
  taskId: Joi.number()
    .integer()
    .required(),
  branchId: Joi.number()
    .integer()
    .optional(),
  departmentId: Joi.number()
    .integer()
    .optional(),
  assignedBy: Joi.number()
    .integer()
    .optional(),
  assignedTo: Joi.number()
    .integer()
    .optional(),
  assignedDate: Joi.date().optional(),
  dueDate: Joi.date().optional(),
  description: Joi.string().optional(),
  status: Joi.string()
    .valid("pending", "completed")
    .optional()
});

module.exports = {
  createTasksSchema,
  createTaskCommentsSchema,
  editTaskSchema
};
