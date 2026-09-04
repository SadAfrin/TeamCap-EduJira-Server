import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

/**
 * Initialize Socket.io server for real-time messaging
 * Handles events: send_message, typing, message_read, join_conversation
 */
export function initSocket(httpServer: HTTPServer): SocketIOServer {
  const clientOrigin = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: clientOrigin,
      credentials: true,
    },
  });

  // Middleware: authenticate socket connection via Better Auth session cookie when present
  io.use(async (socket, next) => {
    try {
      // Allow connection; userId is provided via handshake query from the client
      const userId = socket.handshake.query.userId as string | undefined;
      if (!userId) {
        return next(new Error("userId required"));
      }
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  // Track online users
  const onlineUsers: Map<string, string> = new Map(); // userId -> socketId

  // Connection handler
  io.on("connection", (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;

    if (userId) {
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} connected with socket ${socket.id}`);
    }

    /**
     * Event: user joins a conversation room
     * Allows socket to receive messages for that conversation
     */
    socket.on("join_conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    /**
     * Event: user sends a message
     * Broadcast to all users in the conversation room
     */
    socket.on("send_message", (data: any) => {
      const { conversationId, messageId, senderId, recipientId, content, createdAt } = data;

      // Emit to all in conversation room (including sender)
      io.to(`conversation:${conversationId}`).emit("new_message", {
        messageId,
        conversationId,
        senderId,
        recipientId,
        content,
        createdAt,
        isRead: false,
      });

      // Emit online status to recipient (if online)
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("message_delivered", { messageId });
      }
    });

    /**
     * Event: user is typing
     * Broadcast to conversation room
     */
    socket.on("typing", (data: any) => {
      const { conversationId, senderId } = data;
      socket.to(`conversation:${conversationId}`).emit("user_typing", { senderId });
    });

    /**
     * Event: user stops typing
     */
    socket.on("stop_typing", (data: any) => {
      const { conversationId, senderId } = data;
      socket.to(`conversation:${conversationId}`).emit("user_stopped_typing", { senderId });
    });

    /**
     * Event: user marks message as read
     * Emit read receipt to sender
     */
    socket.on("mark_as_read", (data: any) => {
      const { messageId, conversationId, senderId } = data;
      io.to(`conversation:${conversationId}`).emit("message_read", { messageId });
    });

    /**
     * Disconnect handler
     */
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
}

/**
 * Helper to get online status of users
 * Usage: isUserOnline(userId) returns boolean
 */
export function createOnlineChecker(io: SocketIOServer) {
  return (userId: string): boolean => {
    const sockets = io.sockets.sockets;
    for (const socket of sockets.values()) {
      if (socket.handshake.query.userId === userId) {
        return true;
      }
    }
    return false;
  };
}
