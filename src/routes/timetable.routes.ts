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

const router = Router();

// Routine specific endpoints
router.post("/bulk", createBulkSlots);
router.post("/check-conflict", checkConflict);
router.get("/by-class", getRoutineByClass);
router.get("/by-teacher", getRoutineByTeacher);
router.get("/by-student", getRoutineByStudent);

// CRUD endpoints
router.post("/", createSlot);
router.get("/", getAllSlots);
router.get("/:id", getSlotById);
router.patch("/:id", updateSlot);
router.delete("/:id", deleteSlot);

export default router;
