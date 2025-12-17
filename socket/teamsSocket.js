const jwt = require("jsonwebtoken");
const UserModel = require("../models/Users/userModel");
const TeamChatModel = require("../models/Master/teamChatModel");
const TeamChatMemberModel = require("../models/Master/teamChatMemberModel");
const TeamCallModel = require("../models/Master/teamCallModel");

class TeamsSocket {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // Map of userId -> socketId
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  // Socket.io authentication middleware
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        // Try multiple ways to get the token
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.query?.token ||
          socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
          socket.handshake.headers?.authorization?.replace("bearer ", "");

        if (!token) {
          console.error("Socket authentication error: No token provided");
          return next(new Error("Authentication error: Token required"));
        }

        // Verify JWT token
        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        } catch (jwtError) {
          console.error("Socket JWT verification error:", jwtError.message);
          return next(new Error("Authentication error: Invalid token"));
        }

        // Get user from database
        const user = await UserModel.findByPk(decoded.id);

        if (!user) {
          console.error(
            "Socket authentication error: User not found",
            decoded.id
          );
          return next(new Error("Authentication error: User not found"));
        }

        // Attach user info to socket
        socket.userId = decoded.id;
        socket.userDetails = {
          id: user.id,
          fullName: user.fullName,
          email: user.email
        };

        console.log(`Socket authenticated: ${user.fullName} (${user.id})`);
        next();
      } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication error: " + error.message));
      }
    });
  }

  setupEventHandlers() {
    this.io.on("connection", socket => {
      const userId = socket.userId;
      const userName = socket.userDetails?.fullName || "Unknown";

      console.log(
        `User connected: ${userName} (${userId}) - Socket ID: ${socket.id}`
      );

      // Store user connection
      this.connectedUsers.set(userId, socket.id);

      // Emit connection success
      socket.emit("connected", {
        message: "Connected to Teams server",
        userId: userId,
        socketId: socket.id
      });

      // ============ CHAT Events ============

      // Join a chat room
      socket.on("join_chat", async chatId => {
        try {
          // Verify user is a member of the chat
          const isMember = await TeamChatMemberModel.findOne({
            where: { chatId, userId }
          });

          if (!isMember) {
            socket.emit("error", {
              message: "You are not a member of this chat"
            });
            return;
          }

          socket.join(`chat_${chatId}`);
          console.log(`User ${userName} joined chat ${chatId}`);

          // Notify others in the chat
          socket.to(`chat_${chatId}`).emit("user_joined_chat", {
            chatId,
            userId,
            userName
          });
        } catch (error) {
          console.error("Error joining chat:", error);
          socket.emit("error", { message: "Failed to join chat" });
        }
      });

      // Leave a chat room
      socket.on("leave_chat", chatId => {
        socket.leave(`chat_${chatId}`);
        console.log(`User ${userName} left chat ${chatId}`);
      });

      // Send message (broadcast to chat room)
      socket.on("send_message", async data => {
        try {
          const { chatId, message } = data;

          // Verify user is a member
          const isMember = await TeamChatMemberModel.findOne({
            where: { chatId, userId }
          });

          if (!isMember) {
            socket.emit("error", {
              message: "You are not a member of this chat"
            });
            return;
          }

          // Broadcast to all members in the chat room
          this.io.to(`chat_${chatId}`).emit("new_message", {
            chatId,
            message,
            senderId: userId,
            senderName: userName
          });

          console.log(`Message sent in chat ${chatId} by ${userName}`);
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      });

      // User typing indicator
      socket.on("user_typing", data => {
        const { chatId } = data;
        socket.to(`chat_${chatId}`).emit("user_typing", {
          chatId,
          userId,
          userName,
          isTyping: true
        });
      });

      socket.on("user_stopped_typing", data => {
        const { chatId } = data;
        socket.to(`chat_${chatId}`).emit("user_typing", {
          chatId,
          userId,
          userName,
          isTyping: false
        });
      });

      // ============ CALL Events ============

      // Initiate call
      socket.on("initiate_call", async data => {
        try {
          const { receiverId, callType, chatId, callId } = data;

          // Get receiver socket
          const receiverSocketId = this.connectedUsers.get(receiverId);

          if (!receiverSocketId) {
            // Receiver is offline
            socket.emit("call_initiated_offline", {
              message: "Receiver is offline. Call will be recorded in history.",
              receiverId,
              callId
            });
            return;
          }

          // Get receiver user details
          const receiver = await UserModel.findByPk(receiverId);
          if (!receiver) {
            socket.emit("error", { message: "Receiver not found" });
            return;
          }

          // Emit to receiver
          this.io.to(receiverSocketId).emit("incoming_call", {
            callId,
            callerId: userId,
            callerName: userName,
            receiverId,
            callType: callType || "voice",
            chatId
          });

          console.log(
            `Call initiated from ${userName} to ${receiver.fullName}`
          );
        } catch (error) {
          console.error("Error initiating call:", error);
          socket.emit("error", { message: "Failed to initiate call" });
        }
      });

      // Accept call
      socket.on("accept_call", async data => {
        try {
          const { callerId, callId } = data;

          // Get caller socket
          const callerSocketId = this.connectedUsers.get(callerId);

          if (callerSocketId) {
            // Notify caller
            this.io.to(callerSocketId).emit("call_accepted", {
              callId,
              receiverId: userId,
              receiverName: userName
            });
          }

          // Update call status in database
          await TeamCallModel.update(
            { callStatus: "answered" },
            { where: { id: callId } }
          );

          console.log(`Call accepted by ${userName}`);
        } catch (error) {
          console.error("Error accepting call:", error);
          socket.emit("error", { message: "Failed to accept call" });
        }
      });

      // Reject call
      socket.on("reject_call", async data => {
        try {
          const { callerId, callId } = data;

          // Get caller socket
          const callerSocketId = this.connectedUsers.get(callerId);

          if (callerSocketId) {
            this.io.to(callerSocketId).emit("call_rejected", {
              callId,
              receiverId: userId,
              receiverName: userName
            });
          }

          // Update call status
          await TeamCallModel.update(
            { callStatus: "rejected" },
            { where: { id: callId } }
          );

          console.log(`Call rejected by ${userName}`);
        } catch (error) {
          console.error("Error rejecting call:", error);
        }
      });

      // End call
      socket.on("end_call", async data => {
        try {
          const { otherUserId, callId, chatId } = data;

          // Get other user socket
          const otherSocketId = this.connectedUsers.get(otherUserId);

          if (otherSocketId) {
            this.io.to(otherSocketId).emit("call_ended", {
              callId,
              endedBy: userId,
              endedByName: userName
            });
          }

          // Update call status
          const call = await TeamCallModel.findByPk(callId);
          if (call) {
            const duration = Math.floor(
              (new Date() - new Date(call.startTime)) / 1000
            );
            await call.update({
              callStatus: "ended",
              endTime: new Date(),
              duration
            });
          }

          console.log(`Call ended by ${userName}`);
        } catch (error) {
          console.error("Error ending call:", error);
        }
      });

      // WebRTC signaling
      socket.on("call_signal", data => {
        try {
          const { toUserId, signal, callId } = data;

          // Get receiver socket
          const receiverSocketId = this.connectedUsers.get(toUserId);

          if (receiverSocketId) {
            this.io.to(receiverSocketId).emit("call_signal", {
              fromUserId: userId,
              signal,
              callId
            });
          } else {
            socket.emit("error", { message: "Receiver is not connected" });
          }
        } catch (error) {
          console.error("Error sending call signal:", error);
          socket.emit("error", { message: "Failed to send signal" });
        }
      });

      // ============ Disconnection ============

      socket.on("disconnect", reason => {
        console.log(
          `User disconnected: ${userName} (${userId}) - Reason: ${reason}`
        );

        // Remove from connected users
        this.connectedUsers.delete(userId);

        // Notify all chats user was in
        socket.broadcast.emit("user_offline", {
          userId,
          userName
        });
      });
    });
  }

  // Helper method to get socket ID for a user
  getSocketId(userId) {
    return this.connectedUsers.get(userId);
  }

  // Helper method to check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

module.exports = TeamsSocket;
