import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import Notification from "../models/Notification.model";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
  });

  io.on("connection", (socket: Socket) => {
    // Client sends their identity on join
    socket.on("join", (data: { userId?: string; role?: string; className?: string }) => {
      if (data.userId) {
        socket.join(`user_${data.userId}`);
      }
      if (data.role) {
        socket.join(`role_${data.role}`);
      }
      if (data.className) {
        socket.join(`class_${data.className}`);
      }
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export async function sendNotificationAndEmit(payload: {
  recipientId: string;
  recipientRole?: "admin" | "teacher" | "student" | "parent" | "all";
  type:
    | "notice"
    | "leave"
    | "message"
    | "earlyWarning"
    | "assignment"
    | "grade"
    | "attendance"
    | "system";
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  room?: string;
}) {
  try {
    // 1. Create DB notification
    const doc = await Notification.create({
      recipientId: payload.recipientId,
      recipientRole: payload.recipientRole || "all",
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link || "/dashboard",
      metadata: payload.metadata || {},
      isRead: false,
    });

    // 2. Emit Socket.io event if io is running
    if (io) {
      const socketPayload = {
        _id: doc._id,
        recipientId: payload.recipientId,
        recipientRole: payload.recipientRole,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        link: payload.link || "/dashboard",
        createdAt: doc.createdAt,
      };

      if (payload.room) {
        io.to(payload.room).emit("notification:new", socketPayload);
      } else if (payload.recipientRole === "all") {
        io.emit("notification:new", socketPayload);
      } else if (payload.recipientRole) {
        io.to(`role_${payload.recipientRole}`).emit("notification:new", socketPayload);
      } else if (payload.recipientId) {
        io.to(`user_${payload.recipientId}`).emit("notification:new", socketPayload);
      }
    }

    return doc;
  } catch (error) {
    console.error("Failed to send notification and emit:", error);
    return null;
  }
}
