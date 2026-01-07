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
  getNextTicketCodeQuery
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

  // Check if user can access ticket (admin or assigned staff)
  canAccessTicket(ticket) {
    if (this.isAdmin()) return true;
    return (
      ticket.assignedTo === this.currentUserId ||
      ticket.createdBy === this.currentUserId
    );
  }

  // Generate ticket code (e.g., TCK-2025-0001)
  async generateTicketCode() {
    const year = new Date().getFullYear();
    const result = await this.mysqlConnection
      .query(getNextTicketCodeQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while generating ticket code", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    const nextNumber = result[0]?.nextNumber || 1;
    const paddedNumber = String(nextNumber).padStart(4, "0");
    return `TCK-${year}-${paddedNumber}`;
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

    // Role-based filtering: Staff can only see their assigned tickets
    let finalAssignedTo = assignedTo;
    if (!this.isAdmin() && !assignedTo) {
      finalAssignedTo = this.currentUserId;
    }

    const tickets = await this.mysqlConnection
      .query(getTicketsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          status: status || null,
          priority: priority || null,
          assignedTo: finalAssignedTo || null,
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

    const countResult = await this.mysqlConnection
      .query(getTicketsCountQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          status: status || null,
          priority: priority || null,
          assignedTo: finalAssignedTo || null,
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

    // Check access permission
    if (!this.canAccessTicket(ticket)) {
      throw new createError.Forbidden(
        "You don't have permission to access this ticket"
      );
    }

    return ticket;
  }

  // Create new ticket
  async createTicketService() {
    try {
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
        category,
        tags = []
      } = validatedPayload;

      // Ensure assignedTo is a number
      const assignedToNumber = parseInt(assignedTo, 10);
      if (isNaN(assignedToNumber)) {
        throw new createError.BadRequest(
          "Invalid assignedTo value. Must be a valid user ID."
        );
      }

      // Generate ticket code
      const ticketCode = await this.generateTicketCode();

      // Create ticket
      const createdTicket = await TicketsModel.create({
        ticketCode,
        taskDescription,
        assignedTo: assignedToNumber,
        priority,
        category: category || null,
        status: "OPEN",
        createdBy: this.currentUserId
      }).catch(err => {
        console.error("Error while creating ticket:", err);
        console.error("Error details:", {
          name: err.name,
          message: err.message,
          errors: err.errors
        });
        throw new createError.InternalServerError(
          err.message || Constants.SOMETHING_ERROR_OCCURRED
        );
      });

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
            console.log("Error while creating ticket tags", err);
            // Don't throw error, just log it
          });
        }
      }

      // Log creation activity
      await this.logActivity(
        createdTicket.id,
        "CREATED",
        null,
        null,
        `Ticket created: ${taskDescription.substring(0, 50)}...`
      );

      console.log("Ticket created successfully:", createdTicket.id);
      return createdTicket;
    } catch (error) {
      console.error("Error in createTicketService:", error);
      // Re-throw validation errors and other errors as-is
      if (error.isJoi || error.status) {
        throw error;
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

    // Check permission: Admin or creator can update
    if (!this.isAdmin() && existingTicket.createdBy !== this.currentUserId) {
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

    // Check permission: Admin or assigned staff can update status
    if (!this.isAdmin() && existingTicket.assignedTo !== this.currentUserId) {
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
