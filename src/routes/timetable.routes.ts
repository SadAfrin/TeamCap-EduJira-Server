import { Router } from "express";
import {
  createSlot,
  createBulkSlots,
  getAllSlots,
  getRoutineByClass,
  getRoutineByTeacher,
  getRoutineByStudent,
  checkConflict,
  getSlotById,
  updateSlot,
  deleteSlot,
} from "../controllers/timetable.controller";
import { verifyAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyAuth);

// Routine specific endpoints
router.post("/bulk", requireRole("admin", "teacher"), createBulkSlots);
router.post("/check-conflict", requireRole("admin", "teacher"), checkConflict);
router.get("/by-class", getRoutineByClass);
router.get("/by-teacher", getRoutineByTeacher);
router.get("/by-student", getRoutineByStudent);

// CRUD endpoints
router.post("/", requireRole("admin", "teacher"), createSlot);
router.get("/", getAllSlots);
router.get("/:id", getSlotById);
router.patch("/:id", requireRole("admin", "teacher"), updateSlot);
router.delete("/:id", requireRole("admin"), deleteSlot);

export default router;
