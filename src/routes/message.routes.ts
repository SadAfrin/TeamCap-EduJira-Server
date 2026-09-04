import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  startConversation,
  listConversations,
  getMessageHistory,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
} from "../controllers/message.controller";

const router = Router();

// Start or get conversation
router.post("/conversation/start", requireAuth, startConversation);

// List all conversations for user
router.get("/conversations", requireAuth, listConversations);

// Get message history for a conversation
router.get("/conversations/:conversationId/messages", requireAuth, getMessageHistory);

// Send a message
router.post("/", requireAuth, sendMessage);

// Mark message as read
router.put("/:messageId/read", requireAuth, markMessageAsRead);

// Delete a message
router.delete("/:messageId", requireAuth, deleteMessage);

export default router;
