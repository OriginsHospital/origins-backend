const { Sequelize, QueryTypes, Op } = require("sequelize");
const MySqlConnection = require("../connections/mysql_connection");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const lodash = require("lodash");
const BaseService = require("../services/baseService");

// Models
const TeamChatModel = require("../models/Master/teamChatModel");
const TeamChatMemberModel = require("../models/Master/teamChatMemberModel");
const TeamMessageModel = require("../models/Master/teamMessageModel");
const TeamMeetingModel = require("../models/Master/teamMeetingModel");
const TeamMeetingParticipantModel = require("../models/Master/teamMeetingParticipantModel");
const TeamCalendarEventModel = require("../models/Master/teamCalendarEventModel");
const TeamScheduleModel = require("../models/Master/teamScheduleModel");
const TeamCallModel = require("../models/Master/teamCallModel");
const UserModel = require("../models/Users/userModel");

// Schemas
const {
  createChatSchema,
  addChatMembersSchema,
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
} = require("../schemas/teamsSchemas");

const AWSConnection = require("../connections/aws_connection");

class TeamsService extends BaseService {
  constructor(request, response, next) {
    super(request, response, next);
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.s3 = AWSConnection.getS3();
    this.bucketName = AWSConnection.getS3BucketName();
  }

  // ============ CHAT Methods ============

  async getUserChatsService() {
    const userId = this._request?.userDetails?.id;
    const limit = parseInt(this._request.query.limit) || 50;
    const offset = parseInt(this._request.query.offset) || 0;

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Get all chats where user is a member using raw query
    const query = `
      SELECT DISTINCT
        tc.id,
        tc.name,
        tc.description,
        tc.chatType,
        tc.createdBy,
        tc.updatedBy,
        tc.createdAt,
        tc.updatedAt,
        tcm.lastReadAt
      FROM team_chats tc
      INNER JOIN team_chat_members tcm ON tcm.chatId = tc.id
      WHERE tcm.userId = :userId
      ORDER BY tc.updatedAt DESC
      LIMIT :limit OFFSET :offset
    `;

    const chats = await this.mysqlConnection.query(query, {
      replacements: { userId, limit, offset },
      type: Sequelize.QueryTypes.SELECT
    });

    // Format response with additional data
    const formattedChats = await Promise.all(
      chats.map(async chat => {
        const chatId = chat.id;

        // Get members with user data
        const memberQuery = `
          SELECT 
            tcm.id,
            tcm.chatId,
            tcm.userId,
            tcm.role,
            u.id as user_id,
            u.fullName as user_fullName,
            u.email as user_email
          FROM team_chat_members tcm
          LEFT JOIN users u ON u.id = tcm.userId
          WHERE tcm.chatId = :chatId
        `;
        const members = await this.mysqlConnection.query(memberQuery, {
          replacements: { chatId },
          type: Sequelize.QueryTypes.SELECT
        });

        // Get last message
        const messageQuery = `
          SELECT 
            tm.id,
            tm.chatId,
            tm.senderId,
            tm.message,
            tm.messageType,
            tm.createdAt,
            u.id as sender_id,
            u.fullName as sender_fullName
          FROM team_messages tm
          LEFT JOIN users u ON u.id = tm.senderId
          WHERE tm.chatId = :chatId AND tm.isDeleted = 0
          ORDER BY tm.createdAt DESC
          LIMIT 1
        `;
        const lastMessages = await this.mysqlConnection.query(messageQuery, {
          replacements: { chatId },
          type: Sequelize.QueryTypes.SELECT
        });
        const lastMessage = lastMessages[0] || null;

        // For direct chats, find the other user
        let otherUser = null;
        if (chat.chatType === "direct") {
          const otherMember = members.find(m => m.userId !== userId);
          if (otherMember) {
            otherUser = {
              id: otherMember.user_id,
              fullName: otherMember.user_fullName,
              email: otherMember.user_email
            };
          }
        }

        // Get unread count
        const lastReadAt = chat.lastReadAt || new Date(0);
        const unreadCount = await TeamMessageModel.count({
          where: {
            chatId,
            senderId: { [Op.ne]: userId },
            createdAt: { [Op.gt]: lastReadAt },
            isDeleted: false
          }
        });

        return {
          ...chat,
          otherUser,
          name:
            chat.chatType === "direct"
              ? otherUser?.fullName || "Unknown"
              : chat.name,
          members: members.map(m => ({
            id: m.id,
            userId: m.userId,
            role: m.role,
            user: {
              id: m.user_id,
              fullName: m.user_fullName,
              email: m.user_email
            }
          })),
          messages: lastMessage
            ? [
                {
                  id: lastMessage.id,
                  chatId: lastMessage.chatId,
                  senderId: lastMessage.senderId,
                  message: lastMessage.message,
                  messageType: lastMessage.messageType,
                  createdAt: lastMessage.createdAt,
                  sender: {
                    id: lastMessage.sender_id,
                    fullName: lastMessage.sender_fullName
                  }
                }
              ]
            : [],
          unreadCount
        };
      })
    );

    return formattedChats;
  }

  async createChatService() {
    const userId = this._request?.userDetails?.id;
    const bodyData = { ...this._request.body };

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Validate input
    const validatedData = await createChatSchema
      .validateAsync(bodyData)
      .catch(err => {
        throw new createError.BadRequest(err.message || "Validation failed");
      });

    // Ensure creator is in member list
    if (!validatedData.memberIds.includes(userId)) {
      validatedData.memberIds.push(userId);
    }

    // For direct chats, check if chat already exists
    if (
      validatedData.chatType === "direct" &&
      validatedData.memberIds.length === 2
    ) {
      const existingChatQuery = `
        SELECT DISTINCT tc.*
        FROM team_chats tc
        WHERE tc.chatType = 'direct'
        AND tc.id IN (
          SELECT chatId 
          FROM team_chat_members 
          WHERE userId IN (:memberId1, :memberId2)
          GROUP BY chatId
          HAVING COUNT(DISTINCT userId) = 2
        )
        LIMIT 1
      `;
      const existingChats = await this.mysqlConnection.query(
        existingChatQuery,
        {
          replacements: {
            memberId1: validatedData.memberIds[0],
            memberId2: validatedData.memberIds[1]
          },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (existingChats.length > 0) {
        const existingChat = existingChats[0];
        // Get members for this chat
        const memberQuery = `
          SELECT 
            tcm.id,
            tcm.chatId,
            tcm.userId,
            tcm.role,
            u.id as user_id,
            u.fullName as user_fullName,
            u.email as user_email
          FROM team_chat_members tcm
          LEFT JOIN users u ON u.id = tcm.userId
          WHERE tcm.chatId = :chatId
        `;
        const members = await this.mysqlConnection.query(memberQuery, {
          replacements: { chatId: existingChat.id },
          type: Sequelize.QueryTypes.SELECT
        });

        const chatData = { ...existingChat };
        chatData.members = members.map(m => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          user: {
            id: m.user_id,
            fullName: m.user_fullName,
            email: m.user_email
          }
        }));

        // Format for direct chats
        const otherMember = members.find(m => m.userId !== userId);
        if (otherMember) {
          chatData.otherUser = {
            id: otherMember.user_id,
            fullName: otherMember.user_fullName,
            email: otherMember.user_email
          };
          chatData.name = chatData.otherUser.fullName || "Unknown";
        }

        return chatData;
      }
    }

    // Create chat
    const transaction = await this.mysqlConnection.transaction();

    try {
      const newChat = await TeamChatModel.create(
        {
          name: validatedData.name || null,
          description: validatedData.description || null,
          chatType: validatedData.chatType,
          createdBy: userId,
          updatedBy: userId
        },
        { transaction }
      );

      // Add members
      const memberPromises = validatedData.memberIds.map(memberId =>
        TeamChatMemberModel.create(
          {
            chatId: newChat.id,
            userId: memberId,
            role: memberId === userId ? "admin" : "member"
          },
          { transaction }
        )
      );

      await Promise.all(memberPromises);
      await transaction.commit();

      // Fetch created chat with members
      const memberQuery = `
        SELECT 
          tcm.id,
          tcm.chatId,
          tcm.userId,
          tcm.role,
          u.id as user_id,
          u.fullName as user_fullName,
          u.email as user_email
        FROM team_chat_members tcm
        LEFT JOIN users u ON u.id = tcm.userId
        WHERE tcm.chatId = :chatId
      `;
      const members = await this.mysqlConnection.query(memberQuery, {
        replacements: { chatId: newChat.id },
        type: Sequelize.QueryTypes.SELECT
      });

      const chatData = newChat.toJSON();
      chatData.members = members.map(m => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        user: {
          id: m.user_id,
          fullName: m.user_fullName,
          email: m.user_email
        }
      }));

      // Format for direct chats
      if (chatData.chatType === "direct") {
        const otherMember = members.find(m => m.userId !== userId);
        if (otherMember) {
          chatData.otherUser = {
            id: otherMember.user_id,
            fullName: otherMember.user_fullName,
            email: otherMember.user_email
          };
          chatData.name = chatData.otherUser.fullName || "Unknown";
        }
      }

      return chatData;
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating chat:", error);
      throw new createError.InternalServerError(
        "Failed to create chat: " + error.message
      );
    }
  }

  async getChatMessagesService() {
    const userId = this._request?.userDetails?.id;
    const chatId = parseInt(this._request.params.chatId);
    const limit = parseInt(this._request.query.limit) || 50;
    const offset = parseInt(this._request.query.offset) || 0;

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Verify user is a member of the chat
    const isMember = await TeamChatMemberModel.findOne({
      where: { chatId, userId }
    });

    if (!isMember) {
      throw new createError.Forbidden("You are not a member of this chat");
    }

    // Get messages with sender info
    const messageQuery = `
      SELECT 
        tm.*,
        u.id as sender_id,
        u.fullName as sender_fullName,
        u.email as sender_email
      FROM team_messages tm
      LEFT JOIN users u ON u.id = tm.senderId
      WHERE tm.chatId = :chatId AND tm.isDeleted = 0
      ORDER BY tm.createdAt DESC
      LIMIT :limit OFFSET :offset
    `;
    const messages = await this.mysqlConnection.query(messageQuery, {
      replacements: { chatId, limit, offset },
      type: Sequelize.QueryTypes.SELECT
    });

    // Update last read time
    await TeamChatMemberModel.update(
      { lastReadAt: new Date() },
      { where: { chatId, userId } }
    );

    return messages.reverse().map(msg => ({
      id: msg.id,
      chatId: msg.chatId,
      senderId: msg.senderId,
      message: msg.message,
      messageType: msg.messageType,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      replyToMessageId: msg.replyToMessageId,
      mentions: msg.mentions,
      isEdited: msg.isEdited,
      isDeleted: msg.isDeleted,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      sender: {
        id: msg.sender_id,
        fullName: msg.sender_fullName,
        email: msg.sender_email
      }
    }));
  }

  async sendMessageService() {
    const userId = this._request?.userDetails?.id;
    const chatId = parseInt(this._request.params.chatId);

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Verify user is a member
    const isMember = await TeamChatMemberModel.findOne({
      where: { chatId, userId }
    });

    if (!isMember) {
      throw new createError.Forbidden("You are not a member of this chat");
    }

    // Handle file upload if present
    let fileUrl = null;
    let fileName = null;
    let fileSize = null;

    if (this._request.files && this._request.files.file) {
      const file = this._request.files.file[0];
      fileName = file.originalname;
      fileSize = file.size;

      // Upload to S3
      const uniqueFileName = `teams/messages/${chatId}/${Date.now()}_${
        file.originalname
      }`;
      const uploadParams = {
        Bucket: this.bucketName,
        Key: uniqueFileName,
        Body: file.buffer,
        ContentType: file.mimetype
      };

      await this.s3.upload(uploadParams).promise();
      fileUrl = `https://${this.bucketName}.s3.amazonaws.com/${uniqueFileName}`;
    }

    // Get message data from body or form data
    const bodyData = { ...this._request.body };
    if (bodyData.mentions && typeof bodyData.mentions === "string") {
      try {
        bodyData.mentions = JSON.parse(bodyData.mentions);
      } catch (e) {
        bodyData.mentions = null;
      }
    }

    // Validate
    const validatedData = await sendMessageSchema
      .validateAsync({
        ...bodyData,
        fileUrl: fileUrl || bodyData.fileUrl,
        fileName: fileName || bodyData.fileName,
        fileSize: fileSize || bodyData.fileSize
      })
      .catch(err => {
        throw new createError.BadRequest(err.message || "Validation failed");
      });

    // Create message
    const newMessage = await TeamMessageModel.create({
      chatId,
      senderId: userId,
      message: validatedData.message || null,
      messageType: validatedData.messageType || "text",
      fileUrl: validatedData.fileUrl || null,
      fileName: validatedData.fileName || null,
      fileSize: validatedData.fileSize || null,
      replyToMessageId: validatedData.replyToMessageId || null,
      mentions: validatedData.mentions || null
    });

    // Update chat updatedAt
    await TeamChatModel.update(
      { updatedAt: new Date(), updatedBy: userId },
      { where: { id: chatId } }
    );

    // Fetch message with sender
    const messageQuery = `
      SELECT 
        tm.*,
        u.id as sender_id,
        u.fullName as sender_fullName,
        u.email as sender_email
      FROM team_messages tm
      LEFT JOIN users u ON u.id = tm.senderId
      WHERE tm.id = :messageId
    `;
    const messages = await this.mysqlConnection.query(messageQuery, {
      replacements: { messageId: newMessage.id },
      type: Sequelize.QueryTypes.SELECT
    });

    const message = messages[0];
    if (message) {
      return {
        id: message.id,
        chatId: message.chatId,
        senderId: message.senderId,
        message: message.message,
        messageType: message.messageType,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        replyToMessageId: message.replyToMessageId,
        mentions: message.mentions,
        isEdited: message.isEdited,
        isDeleted: message.isDeleted,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        sender: {
          id: message.sender_id,
          fullName: message.sender_fullName,
          email: message.sender_email
        }
      };
    }

    return newMessage.toJSON();
  }

  async editMessageService() {
    const userId = this._request?.userDetails?.id;
    const chatId = parseInt(this._request.params.chatId);
    const messageId = parseInt(this._request.params.messageId);

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Get message
    const message = await TeamMessageModel.findOne({
      where: { id: messageId, chatId, senderId: userId, isDeleted: false }
    });

    if (!message) {
      throw new createError.NotFound(
        "Message not found or you don't have permission to edit it"
      );
    }

    // Validate
    const validatedData = await editMessageSchema
      .validateAsync(this._request.body)
      .catch(err => {
        throw new createError.BadRequest(err.message || "Validation failed");
      });

    // Update message
    await message.update({
      message: validatedData.message,
      isEdited: true
    });

    return message.toJSON();
  }

  async deleteMessageService() {
    const userId = this._request?.userDetails?.id;
    const chatId = parseInt(this._request.params.chatId);
    const messageId = parseInt(this._request.params.messageId);

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Get message
    const message = await TeamMessageModel.findOne({
      where: { id: messageId, chatId, senderId: userId }
    });

    if (!message) {
      throw new createError.NotFound(
        "Message not found or you don't have permission to delete it"
      );
    }

    // Soft delete
    await message.update({
      isDeleted: true,
      deletedAt: new Date()
    });

    return { success: true };
  }

  async addChatMembersService() {
    const userId = this._request?.userDetails?.id;
    const chatId = parseInt(this._request.params.chatId);

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Verify user is admin of the chat
    const member = await TeamChatMemberModel.findOne({
      where: { chatId, userId }
    });

    if (!member || member.role !== "admin") {
      throw new createError.Forbidden("Only admins can add members");
    }

    // Validate
    const validatedData = await addChatMembersSchema
      .validateAsync(this._request.body)
      .catch(err => {
        throw new createError.BadRequest(err.message || "Validation failed");
      });

    // Add members
    const memberPromises = validatedData.memberIds.map(memberId =>
      TeamChatMemberModel.findOrCreate({
        where: { chatId, userId: memberId },
        defaults: {
          chatId,
          userId: memberId,
          role: "member"
        }
      })
    );

    await Promise.all(memberPromises);

    return { success: true, addedCount: validatedData.memberIds.length };
  }

  async removeChatMemberService() {
    const userId = this._request?.userDetails?.id;
    const chatId = parseInt(this._request.params.chatId);
    const memberId = parseInt(this._request.params.memberId);

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Verify user is admin or removing themselves
    const member = await TeamChatMemberModel.findOne({
      where: { chatId, userId }
    });

    if (!member) {
      throw new createError.Forbidden("You are not a member of this chat");
    }

    if (memberId !== userId && member.role !== "admin") {
      throw new createError.Forbidden("Only admins can remove other members");
    }

    // Remove member
    await TeamChatMemberModel.destroy({
      where: { chatId, userId: memberId }
    });

    return { success: true };
  }

  // ============ MEETING Methods ============

  async getUserMeetingsService() {
    const userId = this._request?.userDetails?.id;
    const startDate = this._request.query.startDate;
    const endDate = this._request.query.endDate;
    const status = this._request.query.status;

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    const whereClause = {};

    if (startDate && endDate) {
      whereClause.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (status) {
      whereClause.status = status;
    }

    // Get meetings where user is creator or participant using raw query
    let meetingQuery = `
      SELECT DISTINCT
        tm.*,
        creator.id as creator_id,
        creator.fullName as creator_fullName,
        creator.email as creator_email
      FROM team_meetings tm
      LEFT JOIN users creator ON creator.id = tm.createdBy
      WHERE (
        tm.createdBy = :userId 
        OR tm.id IN (SELECT meetingId FROM team_meeting_participants WHERE userId = :userId)
      )
    `;

    if (startDate && endDate) {
      meetingQuery += ` AND tm.startTime BETWEEN :startDate AND :endDate`;
    }

    if (status) {
      meetingQuery += ` AND tm.status = :status`;
    }

    meetingQuery += ` ORDER BY tm.startTime ASC`;

    const meetings = await this.mysqlConnection.query(meetingQuery, {
      replacements: { userId, startDate, endDate, status },
      type: Sequelize.QueryTypes.SELECT
    });

    // Get participants for each meeting
    const meetingsWithParticipants = await Promise.all(
      meetings.map(async meeting => {
        const participantQuery = `
          SELECT 
            tmp.*,
            u.id as user_id,
            u.fullName as user_fullName,
            u.email as user_email
          FROM team_meeting_participants tmp
          LEFT JOIN users u ON u.id = tmp.userId
          WHERE tmp.meetingId = :meetingId
        `;
        const participants = await this.mysqlConnection.query(
          participantQuery,
          {
            replacements: { meetingId: meeting.id },
            type: Sequelize.QueryTypes.SELECT
          }
        );

        return {
          ...meeting,
          creator: {
            id: meeting.creator_id,
            fullName: meeting.creator_fullName,
            email: meeting.creator_email
          },
          participants: participants.map(p => ({
            id: p.id,
            meetingId: p.meetingId,
            userId: p.userId,
            status: p.status,
            joinedAt: p.joinedAt,
            leftAt: p.leftAt,
            user: {
              id: p.user_id,
              fullName: p.user_fullName,
              email: p.user_email
            }
          }))
        };
      })
    );

    return meetingsWithParticipants;
  }

  async createMeetingService() {
    const userId = this._request?.userDetails?.id;

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Validate
    const validatedData = await createMeetingSchema
      .validateAsync(this._request.body)
      .catch(err => {
        throw new createError.BadRequest(err.message || "Validation failed");
      });

    // Generate meeting link (you can integrate with Zoom/Teams API here)
    const meetingLink = `https://meet.example.com/${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const transaction = await this.mysqlConnection.transaction();

    try {
      // Create meeting
      const newMeeting = await TeamMeetingModel.create(
        {
          ...validatedData,
          meetingLink,
          createdBy: userId,
          updatedBy: userId
        },
        { transaction }
      );

      // Add participants
      const participantIds = validatedData.participantIds || [];
      if (!participantIds.includes(userId)) {
        participantIds.push(userId);
      }

      const participantPromises = participantIds.map(participantId =>
        TeamMeetingParticipantModel.create(
          {
            meetingId: newMeeting.id,
            userId: participantId,
            status: participantId === userId ? "accepted" : "invited"
          },
          { transaction }
        )
      );

      await Promise.all(participantPromises);
      await transaction.commit();

      // Fetch created meeting with participants
      const participantQuery = `
        SELECT 
          tmp.*,
          u.id as user_id,
          u.fullName as user_fullName,
          u.email as user_email
        FROM team_meeting_participants tmp
        LEFT JOIN users u ON u.id = tmp.userId
        WHERE tmp.meetingId = :meetingId
      `;
      const participants = await this.mysqlConnection.query(participantQuery, {
        replacements: { meetingId: newMeeting.id },
        type: Sequelize.QueryTypes.SELECT
      });

      const meetingData = newMeeting.toJSON();
      meetingData.participants = participants.map(p => ({
        id: p.id,
        meetingId: p.meetingId,
        userId: p.userId,
        status: p.status,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        user: {
          id: p.user_id,
          fullName: p.user_fullName,
          email: p.user_email
        }
      }));

      return meetingData;
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating meeting:", error);
      throw new createError.InternalServerError(
        "Failed to create meeting: " + error.message
      );
    }
  }

  async updateMeetingService() {
    const userId = this._request?.userDetails?.id;
    const meetingId = parseInt(this._request.params.meetingId);

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Get meeting
    const meeting = await TeamMeetingModel.findOne({
      where: { id: meetingId, createdBy: userId }
    });

    if (!meeting) {
      throw new createError.NotFound(
        "Meeting not found or you don't have permission to update it"
      );
    }

    // Validate
    const validatedData = await updateMeetingSchema
      .validateAsync(this._request.body)
      .catch(err => {
        throw new createError.BadRequest(err.message || "Validation failed");
      });

    // Update meeting
    await meeting.update({
      ...validatedData,
      updatedBy: userId
    });

    // Update participants if provided
    if (validatedData.participantIds) {
      await TeamMeetingParticipantModel.destroy({
        where: { meetingId }
      });

      const participantPromises = validatedData.participantIds.map(
        participantId =>
          TeamMeetingParticipantModel.create({
            meetingId,
            userId: participantId,
            status: "invited"
          })
      );

      await Promise.all(participantPromises);
    }

    return meeting.toJSON();
  }

  async joinMeetingService() {
    const userId = this._request?.userDetails?.id;
    const meetingId = parseInt(this._request.params.meetingId);

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Get meeting
    const meeting = await TeamMeetingModel.findByPk(meetingId);

    if (!meeting) {
      throw new createError.NotFound("Meeting not found");
    }

    // Update participant status
    await TeamMeetingParticipantModel.update(
      {
        status: "accepted",
        joinedAt: new Date()
      },
      {
        where: { meetingId, userId }
      }
    );

    // Update meeting status if not already ongoing
    if (meeting.status === "scheduled") {
      await meeting.update({ status: "ongoing" });
    }

    return {
      meetingLink: meeting.meetingLink,
      meeting: meeting.toJSON()
    };
  }

  async deleteMeetingService() {
    const userId = this._request?.userDetails?.id;
    const meetingId = parseInt(this._request.params.meetingId);

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Get meeting
    const meeting = await TeamMeetingModel.findOne({
      where: { id: meetingId, createdBy: userId }
    });

    if (!meeting) {
      throw new createError.NotFound(
        "Meeting not found or you don't have permission to delete it"
      );
    }

    // Delete meeting (cascade will delete participants)
    await meeting.destroy();

    return { success: true };
  }

  // ============ CALENDAR EVENT Methods ============

  async getCalendarEventsService() {
    const userId = this._request?.userDetails?.id;
    const startDate = this._request.query.startDate;
    const endDate = this._request.query.endDate;
    const eventType = this._request.query.eventType;

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    const whereClause = {
      createdBy: userId
    };

    if (startDate && endDate) {
      whereClause.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (eventType) {
      whereClause.eventType = eventType;
    }

    let eventQuery = `
      SELECT 
        tce.*,
        u.id as creator_id,
        u.fullName as creator_fullName,
        u.email as creator_email
      FROM team_calendar_events tce
      LEFT JOIN users u ON u.id = tce.createdBy
      WHERE tce.createdBy = :userId
    `;

    if (startDate && endDate) {
      eventQuery += ` AND tce.startTime BETWEEN :startDate AND :endDate`;
    }

    if (eventType) {
      eventQuery += ` AND tce.eventType = :eventType`;
    }

    eventQuery += ` ORDER BY tce.startTime ASC`;

    const events = await this.mysqlConnection.query(eventQuery, {
      replacements: { userId, startDate, endDate, eventType },
      type: Sequelize.QueryTypes.SELECT
    });

    return events.map(e => ({
      ...e,
      creator: {
        id: e.creator_id,
        fullName: e.creator_fullName,
        email: e.creator_email
      }
    }));
  }

  async createCalendarEventService() {
    const userId = this._request?.userDetails?.id;

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Validate
    const validatedData = await createCalendarEventSchema
      .validateAsync(this._request.body)
      .catch(err => {
        throw new createError.BadRequest(err.message || "Validation failed");
      });

    // Create event
    const newEvent = await TeamCalendarEventModel.create({
      ...validatedData,
      createdBy: userId,
      updatedBy: userId
    });

    return newEvent.toJSON();
  }

  async updateCalendarEventService() {
    const userId = this._request?.userDetails?.id;
    const eventId = parseInt(this._request.params.eventId);

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Get event
    const event = await TeamCalendarEventModel.findOne({
      where: { id: eventId, createdBy: userId }
    });

    if (!event) {
      throw new createError.NotFound(
        "Event not found or you don't have permission to update it"
      );
    }

    // Validate
    const validatedData = await updateCalendarEventSchema
      .validateAsync(this._request.body)
      .catch(err => {
        throw new createError.BadRequest(err.message || "Validation failed");
      });

    // Update event
    await event.update({
      ...validatedData,
      updatedBy: userId
    });

    return event.toJSON();
  }

  async deleteCalendarEventService() {
    const userId = this._request?.userDetails?.id;
    const eventId = parseInt(this._request.params.eventId);

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Get event
    const event = await TeamCalendarEventModel.findOne({
      where: { id: eventId, createdBy: userId }
    });

    if (!event) {
      throw new createError.NotFound(
        "Event not found or you don't have permission to delete it"
      );
    }

    // Delete event
    await event.destroy();

    return { success: true };
  }

  // ============ SCHEDULE Methods ============

  async getSchedulesService() {
    const userId = this._request?.userDetails?.id;
    const startDate = this._request.query.startDate;
    const endDate = this._request.query.endDate;
    const scheduleType = this._request.query.scheduleType;
    const assignedTo = this._request.query.assignedTo;
    const departmentId = this._request.query.departmentId;

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    const whereClause = {};

    if (startDate && endDate) {
      whereClause.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (scheduleType) {
      whereClause.scheduleType = scheduleType;
    }

    if (assignedTo) {
      whereClause.assignedTo = parseInt(assignedTo);
    }

    if (departmentId) {
      whereClause.departmentId = parseInt(departmentId);
    }

    let scheduleQuery = `
      SELECT 
        ts.*,
        assigned.id as assignedUser_id,
        assigned.fullName as assignedUser_fullName,
        assigned.email as assignedUser_email,
        creator.id as creator_id,
        creator.fullName as creator_fullName,
        creator.email as creator_email
      FROM team_schedules ts
      LEFT JOIN users assigned ON assigned.id = ts.assignedTo
      LEFT JOIN users creator ON creator.id = ts.createdBy
      WHERE 1=1
    `;

    if (startDate && endDate) {
      scheduleQuery += ` AND ts.startTime BETWEEN :startDate AND :endDate`;
    }

    if (scheduleType) {
      scheduleQuery += ` AND ts.scheduleType = :scheduleType`;
    }

    if (assignedTo) {
      scheduleQuery += ` AND ts.assignedTo = :assignedTo`;
    }

    if (departmentId) {
      scheduleQuery += ` AND ts.departmentId = :departmentId`;
    }

    scheduleQuery += ` ORDER BY ts.startTime ASC`;

    const schedules = await this.mysqlConnection.query(scheduleQuery, {
      replacements: {
        startDate,
        endDate,
        scheduleType,
        assignedTo: assignedTo ? parseInt(assignedTo) : null,
        departmentId: departmentId ? parseInt(departmentId) : null
      },
      type: Sequelize.QueryTypes.SELECT
    });

    return schedules.map(s => ({
      ...s,
      assignedUser: s.assignedTo
        ? {
            id: s.assignedUser_id,
            fullName: s.assignedUser_fullName,
            email: s.assignedUser_email
          }
        : null,
      creator: {
        id: s.creator_id,
        fullName: s.creator_fullName,
        email: s.creator_email
      }
    }));
  }

  async createScheduleService() {
    const userId = this._request?.userDetails?.id;

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Validate
    const validatedData = await createScheduleSchema
      .validateAsync(this._request.body)
      .catch(err => {
        throw new createError.BadRequest(err.message || "Validation failed");
      });

    // Create schedule
    const newSchedule = await TeamScheduleModel.create({
      ...validatedData,
      createdBy: userId,
      updatedBy: userId
    });

    return newSchedule.toJSON();
  }

  async updateScheduleService() {
    const userId = this._request?.userDetails?.id;
    const scheduleId = parseInt(this._request.params.scheduleId);

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Get schedule
    const schedule = await TeamScheduleModel.findOne({
      where: { id: scheduleId, createdBy: userId }
    });

    if (!schedule) {
      throw new createError.NotFound(
        "Schedule not found or you don't have permission to update it"
      );
    }

    // Validate
    const validatedData = await updateScheduleSchema
      .validateAsync(this._request.body)
      .catch(err => {
        throw new createError.BadRequest(err.message || "Validation failed");
      });

    // Update schedule
    await schedule.update({
      ...validatedData,
      updatedBy: userId
    });

    return schedule.toJSON();
  }

  async deleteScheduleService() {
    const userId = this._request?.userDetails?.id;
    const scheduleId = parseInt(this._request.params.scheduleId);

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Get schedule
    const schedule = await TeamScheduleModel.findOne({
      where: { id: scheduleId, createdBy: userId }
    });

    if (!schedule) {
      throw new createError.NotFound(
        "Schedule not found or you don't have permission to delete it"
      );
    }

    // Delete schedule
    await schedule.destroy();

    return { success: true };
  }

  // ============ CALL Methods ============

  async initiateCallService() {
    const userId = this._request?.userDetails?.id;

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Validate
    const validatedData = await initiateCallSchema
      .validateAsync(this._request.body)
      .catch(err => {
        throw new createError.BadRequest(err.message || "Validation failed");
      });

    if (validatedData.receiverId === userId) {
      throw new createError.BadRequest("Cannot call yourself");
    }

    // Create call record
    const newCall = await TeamCallModel.create({
      chatId: validatedData.chatId || null,
      callerId: userId,
      receiverId: validatedData.receiverId,
      callType: validatedData.callType || "voice",
      callStatus: "initiated",
      startTime: new Date()
    });

    return newCall.toJSON();
  }

  async updateCallStatusService() {
    const userId = this._request?.userDetails?.id;
    const callId = parseInt(this._request.params.callId);

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Get call
    const call = await TeamCallModel.findOne({
      where: {
        id: callId,
        [Op.or]: [{ callerId: userId }, { receiverId: userId }]
      }
    });

    if (!call) {
      throw new createError.NotFound("Call not found");
    }

    // Validate
    const validatedData = await updateCallStatusSchema
      .validateAsync(this._request.body)
      .catch(err => {
        throw new createError.BadRequest(err.message || "Validation failed");
      });

    // Calculate duration if call ended
    let duration = validatedData.duration;
    if (validatedData.callStatus === "ended" && !duration && call.startTime) {
      duration = Math.floor((new Date() - new Date(call.startTime)) / 1000);
    }

    // Update call
    await call.update({
      callStatus: validatedData.callStatus,
      endTime: validatedData.callStatus === "ended" ? new Date() : null,
      duration: duration || null
    });

    return call.toJSON();
  }

  async getCallHistoryService() {
    const userId = this._request?.userDetails?.id;
    const limit = parseInt(this._request.query.limit) || 50;
    const offset = parseInt(this._request.query.offset) || 0;

    if (!userId) {
      throw new createError.Unauthorized("User not authenticated");
    }

    // Get calls where user is caller or receiver
    const callQuery = `
      SELECT 
        tc.*,
        caller.id as caller_id,
        caller.fullName as caller_fullName,
        caller.email as caller_email,
        receiver.id as receiver_id,
        receiver.fullName as receiver_fullName,
        receiver.email as receiver_email
      FROM team_calls tc
      LEFT JOIN users caller ON caller.id = tc.callerId
      LEFT JOIN users receiver ON receiver.id = tc.receiverId
      WHERE (tc.callerId = :userId OR tc.receiverId = :userId)
      ORDER BY tc.startTime DESC
      LIMIT :limit OFFSET :offset
    `;

    const calls = await this.mysqlConnection.query(callQuery, {
      replacements: { userId, limit, offset },
      type: Sequelize.QueryTypes.SELECT
    });

    return calls.map(c => ({
      ...c,
      caller: {
        id: c.caller_id,
        fullName: c.caller_fullName,
        email: c.caller_email
      },
      receiver: {
        id: c.receiver_id,
        fullName: c.receiver_fullName,
        email: c.receiver_email
      }
    }));
  }
}

module.exports = TeamsService;
