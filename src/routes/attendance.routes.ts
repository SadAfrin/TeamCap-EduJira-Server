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
import { verifyAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyAuth);

// Marking attendance (Admin & Teacher only)
router.post("/bulk", requireRole("admin", "teacher"), bulkMarkAttendance);
router.post("/mark", requireRole("admin", "teacher"), markAttendance);
router.post("/", requireRole("admin", "teacher"), markAttendance);

// Summaries & reports
router.get("/summary/student/:studentId", getStudentAttendanceSummary);
router.get("/summary/class", getClassAttendanceSummary);

// Queries & CRUD
router.get("/all", getAllAttendance);
router.get("/", getAttendanceByClassDate);
router.get("/:id", getAttendanceById);
router.patch("/:id", requireRole("admin", "teacher"), updateAttendance);
router.delete("/:id", requireRole("admin"), deleteAttendance);

export default router;
