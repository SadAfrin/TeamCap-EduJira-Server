import { Router } from "express";
import {
  markAttendance,
  markBulkAttendance,
  getAllAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getStudentAttendanceSummary,
  getClassAttendanceSummary,
} from "../controllers/attendance.controller";

const router = Router();

// Attendance marking
router.post("/mark", markAttendance);
router.post("/bulk", markBulkAttendance);
router.post("/", markAttendance); // Convenience alias

// Summaries & reports
router.get("/summary/student/:studentId", getStudentAttendanceSummary);
router.get("/summary/class", getClassAttendanceSummary);

// General CRUD
router.get("/", getAllAttendance);
router.get("/:id", getAttendanceById);
router.patch("/:id", updateAttendance);
router.delete("/:id", deleteAttendance);

export default router;
