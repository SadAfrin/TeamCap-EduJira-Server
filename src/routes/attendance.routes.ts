import { Router } from "express";
import {
  getAttendanceByClassDate,
  bulkMarkAttendance,
  markAttendance,
  getAllAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getStudentAttendanceSummary,
  getClassAttendanceSummary,
} from "../controllers/attendance.controller";

const router = Router();

// Marking attendance
router.post("/bulk", bulkMarkAttendance);
router.post("/mark", markAttendance);
router.post("/", markAttendance);

// Summaries & reports
router.get("/summary/student/:studentId", getStudentAttendanceSummary);
router.get("/summary/class", getClassAttendanceSummary);

// Queries & CRUD
router.get("/all", getAllAttendance);
router.get("/", getAttendanceByClassDate);
router.get("/:id", getAttendanceById);
router.patch("/:id", updateAttendance);
router.delete("/:id", deleteAttendance);

export default router;
