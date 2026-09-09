import { Request, Response } from "express";
import MessageThread from "../models/MessageThread.model";
import { sendNotificationAndEmit, getIO } from "../lib/socket";

// GET /api/messages/threads - Get threads for parent or teacher
export async function getThreads(req: Request, res: Response) {
  try {
    const { parentId, teacherId, studentId } = req.query;
    const filter: Record<string, any> = {};

    if (parentId) filter.parentId = parentId;
    if (teacherId) filter.teacherId = teacherId;
    if (studentId) filter.studentId = studentId;

    const threads = await MessageThread.find(filter).sort({ lastMessageAt: -1 });
    return res.json({ success: true, data: threads, count: threads.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch threads" });
  }
}

// POST /api/messages/threads - Create or get thread
export async function createOrGetThread(req: Request, res: Response) {
  try {
    const { parentId, parentName, teacherId, teacherName, studentId, studentName, className, subjectName } = req.body;

    if (!parentId || !teacherId || !studentId) {
      return res.status(400).json({ success: false, message: "parentId, teacherId, and studentId are required." });
    }

    let thread = await MessageThread.findOne({ parentId, teacherId, studentId });
    if (!thread) {
      thread = await MessageThread.create({
        parentId,
        parentName: parentName || "Parent",
        teacherId,
        teacherName: teacherName || "Teacher",
        studentId,
        studentName: studentName || "Student",
        className: className || "",
        subjectName: subjectName || "",
        messages: [],
      });
    }

    return res.json({ success: true, data: thread });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to create/get thread" });
  }
}

// POST /api/messages/threads/:id/send - Send a message in thread
export async function sendMessage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { senderRole, senderName, senderEmail, text } = req.body;

    if (!text || !senderRole || !senderEmail) {
      return res.status(400).json({ success: false, message: "senderRole, senderEmail, and text are required." });
    }

    const thread = await MessageThread.findById(id);
    if (!thread) {
      return res.status(404).json({ success: false, message: "Thread not found" });
    }

    const newMsg = {
      senderRole,
      senderName: senderName || "User",
      senderEmail,
      text,
      sentAt: new Date(),
      isRead: false,
    };

    thread.messages.push(newMsg);
    thread.lastMessage = text;
    thread.lastMessageAt = new Date();
    await thread.save();

    // Real-time Socket.io event to recipient
    const recipientEmail = senderRole === "parent" ? thread.teacherId : thread.parentId;
    const io = getIO();
    if (io) {
      io.to(`user_${recipientEmail}`).emit("message:new", {
        threadId: thread._id,
        message: newMsg,
        studentName: thread.studentName,
      });
    }

    // Also send in-app notification
    await sendNotificationAndEmit({
      recipientId: recipientEmail,
      recipientRole: senderRole === "parent" ? "teacher" : "parent",
      type: "message",
      title: `Message from ${senderName}`,
      message: text.slice(0, 80) + (text.length > 80 ? "..." : ""),
      link: senderRole === "parent" ? "/dashboard/teacher/messages" : "/dashboard/parent/messages",
    });

    return res.json({ success: true, message: "Message sent", data: thread });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to send message" });
  }
}
