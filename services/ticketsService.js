const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const { Sequelize } = require("sequelize");
const lodash = require("lodash");
const {
  getTicketsQuery,
  getTicketsCountQuery,
  getTicketDetailsQuery,
  getActiveStaffQuery,
  getNextTicketCodeQuery,
  getLastTicketCodeWithLockQuery
} = require("../queries/tickets_queries");
const {
  createTicketSchema,
  updateTicketSchema,
  updateTicketStatusSchema,
  createTicketCommentSchema,
  getTicketsQuerySchema
} = require("../schemas/ticketsSchema");
const TicketsModel = require("../models/Master/ticketsMaster");
const TicketCommentsModel = require("../models/Master/ticketCommentsModel");
const TicketActivityLogsModel = require("../models/Master/ticketActivityLogsModel");
const TicketTagsModel = require("../models/Master/ticketTagsModel");

class TicketsService {
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

  // Check if user can access ticket (user-level security: only creator or assignee)
  canAccessTicket(ticket) {
    // All users (including admins) can only access tickets they created or are assigned to
    return (
      ticket.assigned_to === this.currentUserId ||
      ticket.created_by === this.currentUserId ||
      ticket.assignedTo === this.currentUserId ||
      ticket.createdBy === this.currentUserId
    );
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

  // Check if a ticket code already exists
  async ticketCodeExists(ticketCode) {
    try {
      const existingTicket = await TicketsModel.findOne({
        where: { ticketCode }
      });
      return !!existingTicket;
    } catch (err) {
      console.error("Error checking ticket code existence:", err);
      // If we can't check, assume it doesn't exist and let the unique constraint handle it
      return false;
    }
  }

  // Generate ticket code (e.g., OR-I-HYD-0005) - standalone version
  async generateTicketCode() {
    const branchCode = await this.getBranchCode();
    const maxAttempts = 10; // Maximum attempts to find a unique code

    try {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const result = await this.mysqlConnection.query(
          getNextTicketCodeQuery,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { branchCode: `OR-I-${branchCode}` }
          }
        );

        let nextNumber;
        if (!result || !result[0]) {
          // No result returned, start from 1
          console.warn("No result from ticket code query, starting from 0001");
          nextNumber = 1;
        } else {
          nextNumber = result[0]?.nextNumber || 1;
        }

        // If this is a retry attempt, increment the number to avoid collision
        if (attempt > 0) {
          nextNumber += attempt;
        }

        const paddedNumber = String(nextNumber).padStart(4, "0");
        const ticketCode = `OR-I-${branchCode}-${paddedNumber}`;

        // Check if this code already exists
        const exists = await this.ticketCodeExists(ticketCode);
        if (!exists) {
          console.log("Generated ticket code:", ticketCode);
          return ticketCode;
        }

        console.warn(
          `Ticket code ${ticketCode} already exists, trying next number...`
        );
      }

      // If we've exhausted all attempts, throw an error
      throw new createError.InternalServerError(
        "Failed to generate a unique ticket code after multiple attempts."
      );
    } catch (err) {
      console.error("Error while generating ticket code:", err);
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
          "Tickets table does not exist. Please run the database migrations first."
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
        `Failed to generate ticket code: ${err.message || "Unknown error"}`
      );
    }
  }

  // Generate ticket code within a transaction (simplified and more reliable)
  async generateTicketCodeInTransaction(transaction) {
    const branchCode = await this.getBranchCode();
    const maxAttempts = 50; // Increased attempts for high concurrency

    try {
      // Try multiple times to get a unique code
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Simple strategy: Get MAX + 1, with increment on retries
        // This is more reliable than complex locking mechanisms

        // Get the MAX number for this branch (within transaction)
        const maxResult = await this.mysqlConnection.query(
          getNextTicketCodeQuery,
          {
            type: Sequelize.QueryTypes.SELECT,
            transaction: transaction,
            replacements: { branchCode: `OR-I-${branchCode}` }
          }
        );

        // Start with MAX + 1
        let nextNumber = maxResult?.[0]?.nextNumber || 1;

        // On retry attempts, add a significant increment to avoid collisions
        // This ensures each retry gets a different number even if MAX hasn't updated yet
        if (attempt > 0) {
          // Use a combination of attempt number and timestamp-based offset
          // This ensures uniqueness even with simultaneous retries
          const timestampOffset = Date.now() % 1000; // Use last 3 digits of timestamp
          nextNumber = nextNumber + attempt * 50 + timestampOffset;
        }

        const paddedNumber = String(nextNumber).padStart(4, "0");
        const ticketCode = `OR-I-${branchCode}-${paddedNumber}`;
        console.log(
          `Transaction attempt ${attempt +
            1}: Generated ticket code: ${ticketCode} (branch: ${branchCode}, number: ${nextNumber})`
        );

        // Quick check if it exists (this is fast with the index)
        const exists = await TicketsModel.findOne({
          where: { ticketCode },
          transaction: transaction,
          attributes: ["id"], // Only fetch id for speed
          raw: true
        });

        if (!exists) {
          console.log(
            `Successfully generated unique ticket code in transaction: ${ticketCode} (attempt ${attempt +
              1}, branch: ${branchCode}, number: ${nextNumber})`
          );
          return ticketCode;
        }

        // If code exists, try next number immediately
        // No delay needed as we're already incrementing the number
        if (attempt < maxAttempts - 1) {
          console.warn(
            `Ticket code ${ticketCode} exists, trying next number (attempt ${attempt +
              1}/${maxAttempts})`
          );
        }
      }

      // If we've exhausted all attempts, throw an error
      throw new createError.InternalServerError(
        "Failed to generate a unique ticket code after multiple attempts."
      );
    } catch (err) {
      console.error("Error while generating ticket code in transaction:", err);
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
          "Tickets table does not exist. Please run the database migrations first."
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
        `Failed to generate ticket code: ${err.message || "Unknown error"}`
      );
    }
  }

  // Log ticket activity
  async logActivity(
    ticketId,
    activityType,
    oldValue = null,
    newValue = null,
    commentText = null
  ) {
    try {
      await TicketActivityLogsModel.create({
        ticketId,
        activityType,
        oldValue,
        newValue,
        commentText,
        performedBy: this.currentUserId
      });
    } catch (err) {
      console.log("Error while logging ticket activity", err);
      // Don't throw error, just log it
    }
  }

  // Get all tickets with filters and pagination
  async getTicketsService() {
    const validatedQuery = await getTicketsQuerySchema.validateAsync(
      this._request.query
    );

    const {
      status,
      priority,
      assignedTo,
      search,
      page = 1,
      limit = 50
    } = validatedQuery;
    const offset = (page - 1) * limit;

    // User-based filtering: ALL users can only see tickets they created or are assigned to
    // This ensures user-level security - users only see tickets relevant to them
    let userIdFilter = this.currentUserId;
    let finalAssignedTo = null; // Ignore assignedTo filter to enforce user-level security

    console.log("Getting tickets with filters:", {
      status: status || null,
      priority: priority || null,
      assignedTo: finalAssignedTo || null,
      userId: userIdFilter,
      search: search || null,
      page,
      limit,
      offset: (page - 1) * limit
    });

    const tickets = await this.mysqlConnection
      .query(getTicketsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          status: status || null,
          priority: priority || null,
          assignedTo: finalAssignedTo || null,
          userId: userIdFilter || null, // Add userId filter for non-admin users
          search: search || null,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      })
      .catch(err => {
        console.log("Error while getting tickets list", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    console.log("Tickets query returned:", tickets?.length || 0, "tickets");
    if (tickets && tickets.length > 0) {
      console.log(
        "Sample ticket IDs:",
        tickets
          .slice(0, 3)
          .map(t => ({
            id: t.id,
            code: t.ticket_code,
            createdBy: t.created_by,
            assignedTo: t.assigned_to
          }))
      );
    }

    const countResult = await this.mysqlConnection
      .query(getTicketsCountQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          status: status || null,
          priority: priority || null,
          assignedTo: finalAssignedTo || null,
          userId: userIdFilter || null, // Add userId filter for non-admin users
          search: search || null
        }
      })
      .catch(err => {
        console.log("Error while getting tickets count", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    const total = countResult[0]?.total || 0;

    return {
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get ticket details by ID
  async getTicketDetailsService() {
    const { ticketId } = this._request.params;

    if (!ticketId) {
      throw new createError.BadRequest("Ticket ID is required");
    }

    const result = await this.mysqlConnection
      .query(getTicketDetailsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          ticketId: parseInt(ticketId)
        }
      })
      .catch(err => {
        console.log("Error while getting ticket details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!result || result.length === 0) {
      throw new createError.NotFound("Ticket not found");
    }

    const ticket = result[0];

    // User-level security: Users can only view tickets they created or are assigned to
    // Handle both snake_case (from raw query) and camelCase (from model) field names
    const createdBy = ticket.created_by || ticket.createdBy;
    const assignedTo = ticket.assigned_to || ticket.assignedTo;

    if (createdBy !== this.currentUserId && assignedTo !== this.currentUserId) {
      throw new createError.Forbidden(
        "You don't have permission to access this ticket"
      );
    }

    return ticket;
  }

  // Create new ticket
  async createTicketService() {
    try {
      // Validate that user is authenticated
      if (!this.currentUserId) {
        throw new createError.Unauthorized(
          "User authentication required to create a ticket"
        );
      }

      // Log incoming request for debugging
      console.log("Creating ticket with payload:", {
        body: this._request.body,
        userId: this.currentUserId
      });

      const validatedPayload = await createTicketSchema.validateAsync(
        this._request.body,
        { abortEarly: false }
      );

      console.log("Validated payload:", validatedPayload);

      const {
        taskDescription,
        assignedTo,
        priority = "MEDIUM",
        department,
        summary,
        category,
        tags = []
      } = validatedPayload;

      // Handle multiple assignees: if array, use first for backward compatibility, otherwise use as-is
      let assignedToNumber;
      if (Array.isArray(assignedTo) && assignedTo.length > 0) {
        assignedToNumber = parseInt(assignedTo[0], 10);
        console.log(
          "Multiple assignees provided, using first:",
          assignedToNumber,
          "from array:",
          assignedTo
        );
      } else {
        assignedToNumber = parseInt(assignedTo, 10);
        console.log("Single assignee provided:", assignedToNumber);
      }

      if (isNaN(assignedToNumber) || assignedToNumber <= 0) {
        throw new createError.BadRequest(
          "Invalid assignedTo value. Must be a valid user ID."
        );
      }

      console.log(
        "Creating ticket with assignedTo:",
        assignedToNumber,
        "createdBy:",
        this.currentUserId
      );

      // Use transaction with retry logic for handling race conditions
      const maxRetries = 30; // Increased retries for high concurrency scenarios
      let retryCount = 0;
      let createdTicket = null;

      while (retryCount < maxRetries && !createdTicket) {
        try {
          // Use transaction with READ COMMITTED isolation level
          // This provides good balance between consistency and avoiding deadlocks
          // The retry logic will handle any race conditions
          createdTicket = await this.mysqlConnection.transaction(
            {
              isolationLevel:
                Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
            },
            async t => {
              // Generate ticket code within transaction
              let ticketCode;
              try {
                ticketCode = await this.generateTicketCodeInTransaction(t);
                console.log(
                  "Generated ticket code:",
                  ticketCode,
                  `(retry attempt: ${retryCount + 1})`
                );
              } catch (codeError) {
                console.error("Failed to generate ticket code:", codeError);
                throw new createError.InternalServerError(
                  "Failed to generate ticket code. Please check database connection."
                );
              }

              // Try to create ticket - let the database unique constraint handle duplicates
              // This is more reliable than pre-checking, as the database handles it atomically
              try {
                const ticket = await TicketsModel.create(
                  {
                    ticketCode,
                    taskDescription,
                    summary: summary || null,
                    assignedTo: assignedToNumber,
                    priority,
                    department: department || null,
                    category: category || null,
                    status: "OPEN",
                    createdBy: this.currentUserId
                  },
                  { transaction: t }
                );

                console.log(
                  "Ticket created successfully:",
                  ticket.id,
                  "with code:",
                  ticketCode,
                  "assignedTo:",
                  assignedToNumber,
                  "createdBy:",
                  this.currentUserId
                );
                return ticket;
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
                        e.type === "unique violation" ||
                        e.path === "ticket_code"
                    ));

                if (isDuplicateError) {
                  console.log(
                    `Duplicate ticket code detected: ${ticketCode} (retry attempt: ${retryCount +
                      1})`
                  );
                  // Throw a retryable error to trigger retry with new code
                  const collisionError = new Error(
                    "Ticket code collision detected"
                  );
                  collisionError.name = "TicketCodeCollisionError";
                  collisionError.status = 409;
                  collisionError.isRetryable = true;
                  throw collisionError;
                }
                // Re-throw other errors
                throw createErr;
              }
            }
          );

          // Success - break out of retry loop
          break;
        } catch (err) {
          console.error("Error while creating ticket:", err);
          console.error("Error details:", {
            name: err.name,
            message: err.message,
            errors: err.errors,
            sql: err.sql,
            retryAttempt: retryCount + 1,
            status: err.status,
            original: err.original,
            originalCode: err.original?.code,
            originalErrno: err.original?.errno,
            originalMessage: err.original?.message,
            stack: err.stack?.substring(0, 500)
          });

          // Handle specific database errors that shouldn't be retried
          if (err.name === "SequelizeForeignKeyConstraintError") {
            throw new createError.BadRequest(
              "Invalid user ID. The assigned user or creator does not exist."
            );
          }

          if (err.name === "SequelizeValidationError") {
            const validationMessages =
              err.errors?.map(e => e.message).join(", ") || err.message;
            throw new createError.BadRequest(validationMessages);
          }

          // Handle duplicate code error or conflict - retry with new code
          // Check for various forms of duplicate/unique constraint errors
          // IMPORTANT: Check ALL possible error formats to catch duplicates
          const isDuplicateError =
            err.name === "SequelizeUniqueConstraintError" ||
            err.name === "SequelizeDatabaseError" ||
            err.name === "UniqueConstraintError" ||
            (err.original &&
              (err.original.code === "ER_DUP_ENTRY" ||
              err.original.code === "23505" || // PostgreSQL duplicate key
              err.original.errno === 1062 || // MySQL duplicate entry
              err.original.errno === 1062 || // MySQL duplicate entry (redundant but explicit)
                err.original.message?.includes("Duplicate entry") ||
                err.original.message?.includes("duplicate") ||
                err.original.message?.includes("UNIQUE"))) ||
            (err.message &&
              (err.message.toLowerCase().includes("duplicate") ||
                err.message.toLowerCase().includes("already exists") ||
                err.message.toLowerCase().includes("unique constraint") ||
                err.message.toLowerCase().includes("unique key") ||
                err.message.toLowerCase().includes("collision") ||
                (err.message.toLowerCase().includes("ticket code") &&
                  err.message.toLowerCase().includes("exists")))) ||
            err.status === 409 ||
            err.statusCode === 409 ||
            err.isRetryable === true ||
            err.name === "TicketCodeCollisionError" ||
            (err.errors &&
              Array.isArray(err.errors) &&
              err.errors.some(
                e =>
                  e.type === "unique violation" ||
                  e.type === "unique" ||
                  e.message?.toLowerCase().includes("must be unique") ||
                  e.message?.toLowerCase().includes("already exists") ||
                  e.message?.toLowerCase().includes("duplicate")
              )) ||
            // Check if error is a Conflict error (409)
            err.statusCode === 409 ||
            // Check SQL error messages
            (err.sql &&
              (err.sql.includes("Duplicate entry") ||
                err.sql.includes("ER_DUP_ENTRY")));

          if (isDuplicateError) {
            retryCount++;
            console.log(
              `[RETRY LOGIC] Duplicate ticket code error detected (attempt ${retryCount}/${maxRetries}):`,
              {
                name: err.name,
                message: err.message,
                originalCode: err.original?.code,
                originalErrno: err.original?.errno,
                status: err.status,
                isRetryable: err.isRetryable
              }
            );

            if (retryCount >= maxRetries) {
              console.error(
                `[RETRY LOGIC] Failed to create ticket after ${maxRetries} attempts due to duplicate codes`
              );
              throw new createError.Conflict(
                "Unable to generate a unique ticket code. Please try again."
              );
            }
            // Wait a bit before retrying (exponential backoff with jitter)
            // Use smaller initial delay but allow it to grow
            const baseDelay = 10;
            const exponentialDelay = baseDelay * Math.pow(1.5, retryCount);
            const jitter = Math.random() * 20; // Add small randomness
            const delay = Math.min(exponentialDelay + jitter, 200);
            console.log(
              `[RETRY LOGIC] Retrying ticket creation in ${Math.round(
                delay
              )}ms (attempt ${retryCount + 1}/${maxRetries})...`
            );
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry with new code
          } else {
            console.log(
              `[RETRY LOGIC] Error is NOT detected as duplicate, will not retry:`,
              {
                name: err.name,
                message: err.message,
                status: err.status,
                hasOriginal: !!err.original,
                originalCode: err.original?.code,
                originalErrno: err.original?.errno
              }
            );
          }

          // For other errors, throw immediately (don't retry)
          throw new createError.InternalServerError(
            err.message || Constants.SOMETHING_ERROR_OCCURRED
          );
        }
      }

      if (!createdTicket) {
        throw new createError.InternalServerError(
          "Failed to create ticket after multiple attempts."
        );
      }

      // Create tags if provided
      if (tags && tags.length > 0) {
        const tagRecords = tags
          .filter(tag => tag && tag.trim().length > 0)
          .map(tag => ({
            ticketId: createdTicket.id,
            tagName: tag.trim()
          }));

        if (tagRecords.length > 0) {
          await TicketTagsModel.bulkCreate(tagRecords).catch(err => {
            console.error("Error while creating ticket tags:", err);
            // Don't throw error, just log it - tags are optional
          });
        }
      }

      // Log creation activity (non-blocking - don't fail ticket creation if logging fails)
      try {
        await this.logActivity(
          createdTicket.id,
          "CREATED",
          null,
          null,
          `Ticket created: ${taskDescription.substring(0, 50)}...`
        );
      } catch (logError) {
        console.error(
          "Error while logging ticket activity (non-critical):",
          logError
        );
        // Don't throw - activity logging failure shouldn't prevent ticket creation
      }

      console.log("Ticket created successfully:", createdTicket.id);
      return createdTicket;
    } catch (error) {
      console.error("Error in createTicketService (outer catch):", error);
      console.error("Error stack:", error.stack);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error status:", error.status);
      console.error("Error original:", error.original);

      // Check if this is a duplicate error that escaped retry logic
      const isDuplicateError =
        error.name === "SequelizeUniqueConstraintError" ||
        (error.original &&
          (error.original.code === "ER_DUP_ENTRY" ||
            error.original.errno === 1062)) ||
        (error.message &&
          (error.message.toLowerCase().includes("duplicate") ||
            error.message.toLowerCase().includes("already exists") ||
            error.message.toLowerCase().includes("ticket code"))) ||
        error.status === 409;

      if (isDuplicateError) {
        console.error(
          "CRITICAL: Duplicate error escaped retry logic! This should not happen."
        );
        throw new createError.Conflict(
          "Unable to generate a unique ticket code. Please try again."
        );
      }

      // Re-throw validation errors and HTTP errors as-is (but not duplicate errors)
      if (error.isJoi || (error.status && !isDuplicateError)) {
        throw error;
      }

      // Handle Sequelize database errors
      // BUT: Don't handle SequelizeUniqueConstraintError here - it should have been caught by retry logic
      if (error.name && error.name.includes("Sequelize")) {
        console.error("Sequelize error details (outer catch):", {
          name: error.name,
          message: error.message,
          original: error.original,
          sql: error.sql,
          status: error.status
        });

        // If this is a unique constraint error that escaped retry logic, it's a serious issue
        if (error.name === "SequelizeUniqueConstraintError") {
          console.error(
            "CRITICAL: SequelizeUniqueConstraintError escaped retry logic!"
          );
          throw new createError.Conflict(
            "Unable to generate a unique ticket code after multiple attempts. Please try again."
          );
        }

        if (error.name === "SequelizeDatabaseError") {
          throw new createError.InternalServerError(
            `Database error: ${error.message ||
              "Please check database connection and table structure"}`
          );
        }

        if (error.name === "SequelizeConnectionError") {
          throw new createError.InternalServerError(
            "Database connection error. Please try again later."
          );
        }
      }

      throw new createError.InternalServerError(
        error.message || Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  // Update ticket
  async updateTicketService() {
    const validatedPayload = await updateTicketSchema.validateAsync(
      this._request.body
    );

    const { ticketId, tags, ...updateFields } = validatedPayload;

    const existingTicket = await TicketsModel.findByPk(ticketId);

    if (!existingTicket) {
      throw new createError.NotFound("Ticket not found");
    }

    // User-level security: Users can only update tickets they created or are assigned to
    if (
      existingTicket.createdBy !== this.currentUserId &&
      existingTicket.assignedTo !== this.currentUserId
    ) {
      throw new createError.Forbidden(
        "You don't have permission to update this ticket"
      );
    }

    // Prevent updating completed tickets
    if (existingTicket.status === "COMPLETED") {
      throw new createError.BadRequest("Cannot update a completed ticket");
    }

    // Track changes for activity log
    const changes = {};
    if (
      updateFields.assignedTo &&
      updateFields.assignedTo !== existingTicket.assignedTo
    ) {
      changes.assignedTo = {
        old: existingTicket.assignedTo,
        new: updateFields.assignedTo
      };
    }
    if (
      updateFields.priority &&
      updateFields.priority !== existingTicket.priority
    ) {
      changes.priority = {
        old: existingTicket.priority,
        new: updateFields.priority
      };
    }

    // Update ticket
    await existingTicket.update(updateFields).catch(err => {
      console.error("Error while updating ticket:", err);
      throw new createError.InternalServerError(
        "Something went wrong while updating the ticket."
      );
    });

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await TicketTagsModel.destroy({
        where: { ticketId: ticketId }
      }).catch(err => {
        console.log("Error while deleting ticket tags", err);
      });

      // Create new tags
      if (tags && tags.length > 0) {
        const tagRecords = tags
          .filter(tag => tag && tag.trim().length > 0)
          .map(tag => ({
            ticketId: ticketId,
            tagName: tag.trim()
          }));

        if (tagRecords.length > 0) {
          await TicketTagsModel.bulkCreate(tagRecords).catch(err => {
            console.log("Error while creating ticket tags", err);
          });
        }
      }
    }

    // Log activity for changes
    if (changes.assignedTo) {
      await this.logActivity(
        ticketId,
        "REASSIGNED",
        changes.assignedTo.old?.toString(),
        changes.assignedTo.new?.toString()
      );
    }
    if (changes.priority) {
      await this.logActivity(
        ticketId,
        "PRIORITY_CHANGE",
        changes.priority.old,
        changes.priority.new
      );
    }

    return existingTicket;
  }

  // Update ticket status
  async updateTicketStatusService() {
    const validatedPayload = await updateTicketStatusSchema.validateAsync(
      this._request.body
    );

    const { ticketId, status } = validatedPayload;

    const existingTicket = await TicketsModel.findByPk(ticketId);

    if (!existingTicket) {
      throw new createError.NotFound("Ticket not found");
    }

    // User-level security: Users can only update status of tickets they created or are assigned to
    if (
      existingTicket.createdBy !== this.currentUserId &&
      existingTicket.assignedTo !== this.currentUserId
    ) {
      throw new createError.Forbidden(
        "You don't have permission to update this ticket status"
      );
    }

    // Validate status transition
    const validTransitions = {
      OPEN: ["IN_PROGRESS", "COMPLETED"],
      IN_PROGRESS: ["OPEN", "COMPLETED"],
      COMPLETED: [] // Completed tickets cannot change status
    };

    if (existingTicket.status === "COMPLETED") {
      throw new createError.BadRequest(
        "Cannot change status of a completed ticket"
      );
    }

    if (!validTransitions[existingTicket.status]?.includes(status)) {
      throw new createError.BadRequest(
        `Invalid status transition from ${existingTicket.status} to ${status}`
      );
    }

    const oldStatus = existingTicket.status;

    // Update status
    await existingTicket.update({ status }).catch(err => {
      console.error("Error while updating ticket status:", err);
      throw new createError.InternalServerError(
        "Something went wrong while updating the ticket status."
      );
    });

    // Log status change
    await this.logActivity(ticketId, "STATUS_CHANGE", oldStatus, status);

    return existingTicket;
  }

  // Delete ticket
  async deleteTicketService() {
    const { ticketId } = this._request.params;

    if (!ticketId) {
      throw new createError.BadRequest("Ticket ID is required");
    }

    const existingTicket = await TicketsModel.findByPk(ticketId);

    if (!existingTicket) {
      throw new createError.NotFound("Ticket not found");
    }

    // Only admin can delete tickets
    if (!this.isAdmin()) {
      throw new createError.Forbidden("Only administrators can delete tickets");
    }

    await existingTicket.destroy().catch(err => {
      console.error("Error while deleting ticket:", err);
      throw new createError.InternalServerError(
        "Something went wrong while deleting the ticket."
      );
    });

    return Constants.DATA_DELETED_SUCCESS;
  }

  // Create ticket comment
  async createTicketCommentService() {
    const validatedPayload = await createTicketCommentSchema.validateAsync(
      this._request.body
    );

    const { ticketId, commentText } = validatedPayload;

    const existingTicket = await TicketsModel.findByPk(ticketId);

    if (!existingTicket) {
      throw new createError.NotFound("Ticket not found");
    }

    // Check access permission
    if (!this.canAccessTicket(existingTicket)) {
      throw new createError.Forbidden(
        "You don't have permission to comment on this ticket"
      );
    }

    // Create comment
    const comment = await TicketCommentsModel.create({
      ticketId,
      commentText,
      commentedBy: this.currentUserId
    }).catch(err => {
      console.log("Error while creating ticket comment", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    // Log comment activity
    await this.logActivity(
      ticketId,
      "COMMENT",
      null,
      null,
      commentText.substring(0, 100)
    );

    return comment;
  }

  // Get active staff for assignment dropdown
  async getActiveStaffService() {
    const staff = await this.mysqlConnection
      .query(getActiveStaffQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting active staff", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return staff;
  }
}

module.exports = TicketsService;
