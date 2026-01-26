const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const { Sequelize } = require("sequelize");
const {
  getTasksQuery,
  getTasksCountQuery,
  getTaskDetailsQuery
} = require("../queries/tasks_queries");
const {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  getTasksQuerySchema
} = require("../schemas/tasksSchema");
const TasksModel = require("../models/Master/tasksMaster");

class TasksService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.currentUserId = this._request?.userDetails?.id;
    this.currentUserRole = this._request?.userDetails?.roleDetails?.name;
  }

  // Check if user is admin
  isAdmin() {
    return this.currentUserRole?.toLowerCase() === "admin";
  }

  // Get all tasks with filters and pagination
  async getTasksService() {
    try {
      const validatedQuery = await getTasksQuerySchema.validateAsync(
        this._request.query
      );

      const { status, search, page = 1, limit = 50 } = validatedQuery;
      const offset = (page - 1) * limit;

      // Normalize empty strings to null for SQL query
      const statusValue = status && status.trim() !== "" ? status : null;
      const searchValue = search && search.trim() !== "" ? search : null;

      const hasStatusFilter = statusValue !== null;
      const hasSearchFilter = searchValue !== null;

      console.log("Task query params:", {
        status: statusValue,
        search: searchValue,
        page,
        limit,
        offset,
        hasStatusFilter,
        hasSearchFilter
      });

      // Build query dynamically based on filters
      const query = getTasksQuery(hasStatusFilter, hasSearchFilter);
      const countQuery = getTasksCountQuery(hasStatusFilter, hasSearchFilter);

      // Prepare replacements object
      const replacements = {
        limit,
        offset
      };

      if (hasStatusFilter) {
        replacements.status = statusValue;
      }

      if (hasSearchFilter) {
        replacements.search = searchValue;
      }

      // Get tasks
      const tasks = await this.mysqlConnection.query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements
      });

      console.log("Tasks query result:", tasks);
      console.log("Tasks count:", tasks?.length || 0);

      // Get total count
      const countResult = await this.mysqlConnection.query(countQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: hasStatusFilter || hasSearchFilter ? replacements : {}
      });

      const total = countResult[0]?.total || 0;
      const totalPages = Math.ceil(total / limit);

      console.log("Total tasks:", total);
      console.log("Pagination:", { total, page, limit, totalPages });

      return {
        tasks: tasks || [],
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      };
    } catch (err) {
      console.error("Error in getTasksService:", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  // Get task details by ID
  async getTaskDetailsService() {
    const { taskId } = this._request.params;

    if (!taskId) {
      throw new createError.BadRequest("Task ID is required");
    }

    const result = await this.mysqlConnection
      .query(getTaskDetailsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          taskId: parseInt(taskId)
        }
      })
      .catch(err => {
        console.log("Error while getting task details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!result || result.length === 0) {
      throw new createError.NotFound("Task not found");
    }

    return result[0];
  }

  // Create new task
  async createTaskService() {
    try {
      if (!this.currentUserId) {
        throw new createError.Unauthorized(
          "User authentication required to create a task"
        );
      }

      const validatedPayload = await createTaskSchema.validateAsync(
        this._request.body,
        { abortEarly: false }
      );

      const {
        taskName,
        description,
        pendingOn,
        remarks,
        status = "Pending",
        startDate,
        endDate,
        alertEnabled = false,
        alertDate,
        assignedTo
      } = validatedPayload;

      const task = await TasksModel.create({
        taskName,
        description: description || null,
        pendingOn: pendingOn || null,
        remarks: remarks || null,
        status,
        startDate: startDate || null,
        endDate: endDate || null,
        alertEnabled: alertEnabled || false,
        alertDate: alertDate || null,
        assignedTo: assignedTo || null,
        createdBy: this.currentUserId
      }).catch(err => {
        console.log("Error while creating task", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return task;
    } catch (err) {
      console.error("Error in createTaskService:", err);
      if (err.isJoi) {
        throw new createError.BadRequest(err.details[0].message);
      }
      if (err.status) {
        throw err;
      }
      throw new createError.InternalServerError(
        `Failed to create task: ${err.message || "Unknown error"}`
      );
    }
  }

  // Update task
  async updateTaskService() {
    try {
      const validatedPayload = await updateTaskSchema.validateAsync(
        this._request.body,
        { abortEarly: false }
      );

      const { taskId, ...updateData } = validatedPayload;

      const task = await TasksModel.findByPk(taskId);

      if (!task) {
        throw new createError.NotFound("Task not found");
      }

      // Prepare update data, converting camelCase to snake_case for database
      const dbUpdateData = {};
      if (updateData.taskName !== undefined)
        dbUpdateData.taskName = updateData.taskName;
      if (updateData.description !== undefined)
        dbUpdateData.description = updateData.description;
      if (updateData.pendingOn !== undefined)
        dbUpdateData.pendingOn = updateData.pendingOn;
      if (updateData.remarks !== undefined)
        dbUpdateData.remarks = updateData.remarks;
      if (updateData.status !== undefined)
        dbUpdateData.status = updateData.status;
      if (updateData.startDate !== undefined)
        dbUpdateData.startDate = updateData.startDate;
      if (updateData.endDate !== undefined)
        dbUpdateData.endDate = updateData.endDate;
      if (updateData.alertEnabled !== undefined)
        dbUpdateData.alertEnabled = updateData.alertEnabled;
      if (updateData.alertDate !== undefined)
        dbUpdateData.alertDate = updateData.alertDate;
      if (updateData.assignedTo !== undefined)
        dbUpdateData.assignedTo = updateData.assignedTo;

      // Update task
      await task.update(dbUpdateData).catch(err => {
        console.log("Error while updating task", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return task;
    } catch (err) {
      console.error("Error in updateTaskService:", err);
      if (err.isJoi) {
        throw new createError.BadRequest(err.details[0].message);
      }
      if (err.status) {
        throw err;
      }
      throw new createError.InternalServerError(
        `Failed to update task: ${err.message || "Unknown error"}`
      );
    }
  }

  // Update task status
  async updateTaskStatusService() {
    try {
      const validatedPayload = await updateTaskStatusSchema.validateAsync(
        this._request.body,
        { abortEarly: false }
      );

      const { taskId, status } = validatedPayload;

      const task = await TasksModel.findByPk(taskId);

      if (!task) {
        throw new createError.NotFound("Task not found");
      }

      await task.update({ status }).catch(err => {
        console.log("Error while updating task status", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return task;
    } catch (err) {
      console.error("Error in updateTaskStatusService:", err);
      if (err.isJoi) {
        throw new createError.BadRequest(err.details[0].message);
      }
      if (err.status) {
        throw err;
      }
      throw new createError.InternalServerError(
        `Failed to update task status: ${err.message || "Unknown error"}`
      );
    }
  }

  // Delete task
  async deleteTaskService() {
    const { taskId } = this._request.params;

    if (!taskId) {
      throw new createError.BadRequest("Task ID is required");
    }

    const task = await TasksModel.findByPk(taskId);

    if (!task) {
      throw new createError.NotFound("Task not found");
    }

    // Only admin can delete tasks
    if (!this.isAdmin()) {
      throw new createError.Forbidden("Only administrators can delete tasks");
    }

    await task.destroy().catch(err => {
      console.log("Error while deleting task", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_DELETED_SUCCESS;
  }
}

module.exports = TasksService;
