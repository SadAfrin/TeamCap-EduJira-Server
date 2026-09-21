import { Router } from "express";
import {
  createEvent,
  createBulkEvents,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller";
import { verifyAuth, requireRole, optionalAuth } from "../middleware/auth.middleware";

const router = Router();

// Read events (Public / Authenticated)
router.get("/", optionalAuth, getAllEvents);
router.get("/:id", optionalAuth, getEventById);

// Manage events (Admin & Teacher only)
router.post("/bulk", verifyAuth, requireRole("admin", "teacher"), createBulkEvents);
router.post("/", verifyAuth, requireRole("admin", "teacher"), createEvent);
router.patch("/:id", verifyAuth, requireRole("admin", "teacher"), updateEvent);
router.delete("/:id", verifyAuth, requireRole("admin", "teacher"), deleteEvent);

export default router;
