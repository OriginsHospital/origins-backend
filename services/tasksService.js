const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const { Sequelize } = require("sequelize");
const {
  getTasksQuery,
  getTasksCountQuery,
  getTaskDetailsQuery,
  getNextTaskCodeQuery
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

  // Get branch code from user's branch details
  async getBranchCode() {
    try {
      // Try to get branch code from user's branch details
      const userBranchDetails = this._request?.userDetails?.branchDetails;
      console.log("User branch details:", JSON.stringify(userBranchDetails));

      if (
        userBranchDetails &&
        Array.isArray(userBranchDetails) &&
        userBranchDetails.length > 0
      ) {
        const branchId = userBranchDetails[0]?.id;
        console.log("Branch ID from user details:", branchId);

        if (branchId) {
          // Query branch_master to get branch code
          const branchResult = await this.mysqlConnection.query(
            `SELECT branchCode FROM branch_master WHERE id = :branchId LIMIT 1`,
            {
              type: Sequelize.QueryTypes.SELECT,
              replacements: { branchId }
            }
          );
          console.log("Branch query result:", JSON.stringify(branchResult));

          if (branchResult && branchResult[0] && branchResult[0].branchCode) {
            const code = branchResult[0].branchCode.toUpperCase();
            console.log("Using branch code:", code);
            return code;
          }
        }
      }
      // Fallback to default if no branch found
      console.warn("No branch found, using default: ORI");
      return "ORI";
    } catch (err) {
      console.error("Error getting branch code:", err);
      console.error("Error stack:", err.stack);
      return "ORI"; // Default fallback
    }
  }

  // Check if a task code already exists
  async taskCodeExists(taskCode) {
    try {
      const existingTask = await TasksModel.findOne({
        where: { taskCode }
      });
      return !!existingTask;
    } catch (err) {
      console.error("Error checking task code existence:", err);
      // If we can't check, assume it doesn't exist and let the unique constraint handle it
      return false;
    }
  }

  // Generate task code within a transaction (same format as tickets: OR-{BRANCH}-{NUMBER})
  async generateTaskCodeInTransaction(transaction) {
    const branchCode = await this.getBranchCode();
    const maxAttempts = 50; // Increased attempts for high concurrency

    try {
      // Try multiple times to get a unique code
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Get the MAX number for this branch (within transaction)
        const maxResult = await this.mysqlConnection.query(
          getNextTaskCodeQuery,
          {
            type: Sequelize.QueryTypes.SELECT,
            transaction: transaction,
            replacements: { branchCode: `OR-${branchCode}` }
          }
        );

        // Start with MAX + 1
        let nextNumber = maxResult?.[0]?.nextNumber || 1;

        // On retry attempts, add a significant increment to avoid collisions
        if (attempt > 0) {
          // Use a combination of attempt number and timestamp-based offset
          const timestampOffset = Date.now() % 1000; // Use last 3 digits of timestamp
          nextNumber = nextNumber + attempt * 50 + timestampOffset;
        }

        const paddedNumber = String(nextNumber).padStart(4, "0");
        const taskCode = `OR-${branchCode}-${paddedNumber}`;
        console.log(
          `Transaction attempt ${attempt +
            1}: Generated task code: ${taskCode} (branch: ${branchCode}, number: ${nextNumber})`
        );

        // Quick check if it exists (this is fast with the index)
        const exists = await TasksModel.findOne({
          where: { taskCode },
          transaction: transaction,
          attributes: ["id"], // Only fetch id for speed
          raw: true
        });

        if (!exists) {
          console.log(
            `Successfully generated unique task code in transaction: ${taskCode} (attempt ${attempt +
              1}, branch: ${branchCode}, number: ${nextNumber})`
          );
          return taskCode;
        }

        // If code exists, try next number immediately
        if (attempt < maxAttempts - 1) {
          console.warn(
            `Task code ${taskCode} exists, trying next number (attempt ${attempt +
              1}/${maxAttempts})`
          );
        }
      }

      // If we've exhausted all attempts, throw an error
      throw new createError.InternalServerError(
        "Failed to generate a unique task code after multiple attempts."
      );
    } catch (err) {
      console.error("Error while generating task code in transaction:", err);
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        sql: err.sql,
        original: err.original,
        code: err.code
      });

      // Check if it's a table doesn't exist error
      if (err.original && err.original.code === "ER_NO_SUCH_TABLE") {
        throw new createError.InternalServerError(
          "Tasks table does not exist. Please run the database migrations first."
        );
      }

      // Check if it's a database connection error
      if (
        err.name === "SequelizeConnectionError" ||
        err.original?.code === "ECONNREFUSED"
      ) {
        throw new createError.InternalServerError(
          "Database connection failed. Please check your database connection."
        );
      }

      // Re-throw if it's already an HTTP error
      if (err.status) {
        throw err;
      }

      // For other errors, provide generic message
      throw new createError.InternalServerError(
        `Failed to generate task code: ${err.message || "Unknown error"}`
      );
    }
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

      // User-based filtering: ALL users can only see tasks they created or are assigned to
      // This ensures user-level security - users only see tasks relevant to them
      let userIdFilter = this.currentUserId;
      const hasUserIdFilter = userIdFilter !== null;

      console.log("Task query params:", {
        status: statusValue,
        search: searchValue,
        page,
        limit,
        offset,
        hasStatusFilter,
        hasSearchFilter,
        hasUserIdFilter,
        userIdFilter,
        isAdmin: this.isAdmin()
      });

      // Build query dynamically based on filters
      const query = getTasksQuery(
        hasStatusFilter,
        hasSearchFilter,
        hasUserIdFilter
      );
      const countQuery = getTasksCountQuery(
        hasStatusFilter,
        hasSearchFilter,
        hasUserIdFilter
      );

      // Prepare replacements object
      const replacements = {
        limit,
        offset
      };

      if (hasUserIdFilter) {
        replacements.userId = userIdFilter;
      }

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
        replacements:
          hasStatusFilter || hasSearchFilter || hasUserIdFilter
            ? replacements
            : {}
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

    const task = result[0];

    // User-level security: Users can only view tasks they created or are assigned to
    if (
      task.created_by !== this.currentUserId &&
      task.assigned_to !== this.currentUserId
    ) {
      throw new createError.Forbidden(
        "You do not have permission to view this task"
      );
    }

    return task;
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

      // Generate task code within a transaction (same format as tickets)
      let createdTask;
      const maxRetries = 5;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          // Use transaction with READ COMMITTED isolation level
          createdTask = await this.mysqlConnection.transaction(
            {
              isolationLevel:
                Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
            },
            async t => {
              // Generate task code within transaction
              let taskCode;
              try {
                taskCode = await this.generateTaskCodeInTransaction(t);
                console.log(
                  "Generated task code:",
                  taskCode,
                  `(retry attempt: ${retryCount + 1})`
                );
              } catch (codeError) {
                console.error("Failed to generate task code:", codeError);
                throw new createError.InternalServerError(
                  "Failed to generate task code. Please check database connection."
                );
              }

              // Try to create task - let the database unique constraint handle duplicates
              try {
                const task = await TasksModel.create(
                  {
                    taskCode,
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
                  },
                  { transaction: t }
                );

                console.log(
                  "Task created successfully:",
                  task.id,
                  "with code:",
                  taskCode
                );
                return task;
              } catch (createErr) {
                // Catch duplicate key errors - this is the atomic check we need
                const isDuplicateError =
                  createErr.name === "SequelizeUniqueConstraintError" ||
                  (createErr.original &&
                    (createErr.original.code === "ER_DUP_ENTRY" ||
                      createErr.original.errno === 1062)) ||
                  (createErr.message &&
                    createErr.message.toLowerCase().includes("duplicate")) ||
                  (createErr.errors &&
                    Array.isArray(createErr.errors) &&
                    createErr.errors.some(
                      e =>
                        e.type === "unique violation" || e.path === "task_code"
                    ));

                if (isDuplicateError) {
                  console.warn(
                    `Duplicate task code detected (attempt ${retryCount +
                      1}/${maxRetries}), retrying...`
                  );
                  throw createErr; // Re-throw to trigger retry
                }

                // For other errors, log and throw
                console.error("Error creating task:", createErr);
                throw createErr;
              }
            }
          );

          // If we get here, task was created successfully
          break;
        } catch (err) {
          retryCount++;
          console.warn(
            `Task creation attempt ${retryCount} failed:`,
            err.message
          );

          if (retryCount >= maxRetries) {
            console.error(
              "Failed to create task after",
              maxRetries,
              "attempts"
            );
            throw new createError.InternalServerError(
              "Failed to create task after multiple attempts. Please try again."
            );
          }

          // Small delay before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 50 * retryCount));
        }
      }

      return createdTask;
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

      // User-level security: Users can only update tasks they created or are assigned to
      if (
        task.createdBy !== this.currentUserId &&
        task.assignedTo !== this.currentUserId
      ) {
        throw new createError.Forbidden(
          "You do not have permission to update this task"
        );
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

      // User-level security: Users can only update tasks they created or are assigned to
      if (
        task.createdBy !== this.currentUserId &&
        task.assignedTo !== this.currentUserId
      ) {
        throw new createError.Forbidden(
          "You do not have permission to update this task"
        );
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
