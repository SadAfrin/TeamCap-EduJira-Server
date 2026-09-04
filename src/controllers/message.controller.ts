import { Request, Response } from "express";
import Conversation from "../models/Conversation.model";
import Message from "../models/Message.model";
import { sendNewMessageEmail } from "../services/notificationService";
import { findAuthUserById } from "../lib/auth";
import { createOnlineChecker } from "../config/socket";

/**
 * POST /api/messages/conversation/start
 * Start or get existing conversation between two users
 */
export async function startConversation(req: Request, res: Response) {
  try {
    const { recipientId, studentId } = req.body;
    const senderId = req.user?.id;

    if (!recipientId) {
      return res.status(400).json({ 
        success: false, 
        error: "recipientId is required" 
      });
    }

    if (senderId === recipientId) {
      return res.status(400).json({ 
        success: false, 
        error: "Cannot start conversation with yourself" 
      });
    }

    // Sort participants to ensure consistent ordering
    const participants = [senderId, recipientId].sort();

    // Find or create conversation
    let conversation = await Conversation.findOne({ participants });

    if (!conversation) {
      conversation = new Conversation({
        participants,
        studentId: studentId || null,
        isActive: true,
      });
      await conversation.save();
    }

    res.status(201).json({
      success: true,
      conversationId: conversation._id,
      data: conversation,
    });
  } catch (error: unknown) {
    console.error("Error starting conversation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start conversation",
    });
  }
}

/**
 * GET /api/messages/conversations
 * List all conversations for the authenticated user
 */
export async function listConversations(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true,
    })
      .sort({ lastMessageAt: -1 })
      .populate("lastMessage");

    // For each conversation, calculate unread count
    const conversationsWithMeta = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          recipientId: userId,
          isRead: false,
        });
        return {
          ...conv.toObject(),
          unreadCount,
        };
      })
    );

    res.json({
      success: true,
      data: conversationsWithMeta,
    });
  } catch (error: unknown) {
    console.error("Error listing conversations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch conversations",
    });
  }
}

/**
 * GET /api/messages/conversations/:conversationId/messages
 * Fetch message history for a conversation (with pagination)
 */
export async function getMessageHistory(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    const { page = "1", limit = "20" } = req.query;
    const userId = req.user?.id;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId!)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    // Fetch messages
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Mark all recipient's messages as read
    await Message.updateMany(
      {
        conversationId,
        recipientId: userId,
        isRead: false,
      },
      { isRead: true, deliveredAt: new Date() }
    );

    res.json({
      success: true,
      data: messages.reverse(), // Return in ascending order (oldest first)
      pagination: { page: pageNum, limit: limitNum, total: messages.length },
    });
  } catch (error: unknown) {
    console.error("Error fetching message history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch message history",
    });
  }
}

/**
 * POST /api/messages
 * Send a message in a conversation
 */
export async function sendMessage(req: Request, res: Response) {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user?.id;
    const senderName = req.user?.name;

    if (!conversationId || !content) {
      return res.status(400).json({ 
        success: false, 
        error: "conversationId and content are required" 
      });
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(senderId!)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    // Get recipient (the other participant)
    const recipientId = conversation.participants.find((p: string) => p !== senderId);

    // Create message
    const message = new Message({
      conversationId,
      senderId,
      recipientId,
      content,
      isRead: false,
      deliveredAt: null,
    });

    await message.save();

    // Update conversation's last message
    conversation.lastMessage = message._id.toString();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Emit via Socket.io if recipient is online
    const io = (global as any).io;
    let recipientOnline = false;
    if (io) {
      io.to(`conversation:${conversationId}`).emit("new_message", {
        messageId: message._id,
        conversationId,
        senderId,
        senderName,
        recipientId,
        content,
        createdAt: message.createdAt,
        isRead: false,
      });
      recipientOnline = createOnlineChecker(io)(recipientId!);
    }

    if (!recipientOnline && recipientId) {
      try {
        const recipient = await findAuthUserById(recipientId);
        if (recipient?.email) {
          const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(
            /\/$/,
            ""
          );
          await sendNewMessageEmail(
            String(recipient.email),
            senderName || "Someone",
            content,
            `${clientUrl}/messages/${conversationId}`
          );
        }
      } catch (emailError) {
        console.error("Failed to send offline message email:", emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: message,
    });
  } catch (error: unknown) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send message",
    });
  }
}

/**
 * PUT /api/messages/:messageId/read
 * Mark a message as read
 */
export async function markMessageAsRead(req: Request, res: Response) {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: "Message not found" });
    }

    // Only recipient can mark as read
    if (message.recipientId !== userId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    message.isRead = true;
    message.deliveredAt = new Date();
    await message.save();

    // Emit read receipt via Socket.io
    const io = (global as any).io;
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit("message_read", {
        messageId,
      });
    }

    res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error: unknown) {
    console.error("Error marking message as read:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark message as read",
    });
  }
}

/**
 * DELETE /api/messages/:messageId
 * Delete a message (soft delete - only for sender within time limit)
 */
export async function deleteMessage(req: Request, res: Response) {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: "Message not found" });
    }

    // Only sender can delete, and only within 5 minutes
    if (message.senderId !== userId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const timeDiff = Date.now() - message.createdAt.getTime();
    const fiveMinutes = 5 * 60 * 1000;
    if (timeDiff > fiveMinutes) {
      return res.status(400).json({ 
        success: false, 
        error: "Cannot delete message after 5 minutes" 
      });
    }

    await Message.deleteOne({ _id: messageId });

    // Emit delete event via Socket.io
    const io = (global as any).io;
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit("message_deleted", {
        messageId,
      });
    }

    res.json({
      success: true,
      message: "Message deleted",
    });
  } catch (error: unknown) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete message",
    });
  }
}
