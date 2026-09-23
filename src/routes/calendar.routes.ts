import { Router } from "express";
import {
  getAllCalendars,
  createCalendar,
  createBulkCalendars,
  getCalendarById,
  updateCalendar,
  deleteCalendar,
} from "../controllers/calendar.controller";
import { verifyAuth, requireRole, optionalAuth } from "../middleware/auth.middleware";

const router = Router();

// Read calendar entries (Public / Authenticated)
router.get("/", optionalAuth, getAllCalendars);
router.get("/:id", optionalAuth, getCalendarById);

// Manage calendar entries (Admin & Teacher only)
router.post("/", verifyAuth, requireRole("admin", "teacher"), createCalendar);
router.post("/bulk", verifyAuth, requireRole("admin", "teacher"), createBulkCalendars);
router.patch("/:id", verifyAuth, requireRole("admin", "teacher"), updateCalendar);
router.delete("/:id", verifyAuth, requireRole("admin", "teacher"), deleteCalendar);

export default router;
