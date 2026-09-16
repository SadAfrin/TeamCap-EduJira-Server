import { Router } from "express";
import {
  getAllCalendars,
  createCalendar,
  createBulkCalendars,
  getCalendarById,
  updateCalendar,
  deleteCalendar,
} from "../controllers/calendar.controller";

const router = Router();

router.get("/", getAllCalendars);
router.post("/", createCalendar);
router.post("/bulk", createBulkCalendars);
router.get("/:id", getCalendarById);
router.patch("/:id", updateCalendar);
router.delete("/:id", deleteCalendar);

export default router;
