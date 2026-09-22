import { Router } from "express";
import {
  getAllStudents,
  getPendingStudents,
  registerStudent,
  approveStudent,
  rejectStudent,
  checkStudentStatus,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getClassOptions,
  verifyStudentQR,
  getTopStudents,
} from "../controllers/student.controller";
import { verifyAuth, requireRole, optionalAuth } from "../middleware/auth.middleware";

const router = Router();

// Public routes (Registration & Class dropdown)
router.get("/classes", optionalAuth, getClassOptions);
router.get("/status", checkStudentStatus);
router.post("/register", registerStudent);

// Protected routes (Admin & Teacher)
router.get("/pending", verifyAuth, requireRole("admin", "teacher"), getPendingStudents);
router.post("/:id/approve", verifyAuth, requireRole("admin", "teacher"), approveStudent);
router.post("/:id/reject", verifyAuth, requireRole("admin", "teacher"), rejectStudent);

// STATIC GET ROUTES (Must go above /:id)
router.get("/", verifyAuth, getAllStudents);
router.get("/leaderboard", verifyAuth, getTopStudents); // 🚨 Moved up! (Added verifyAuth to match your frontend credentials config)

// DYNAMIC ID ROUTES (Must go below static routes)
router.get("/verify/:id", verifyStudentQR);
router.get("/:id", verifyAuth, getStudentById);

// STANDARD CRUD (Using /:id)
router.post("/", verifyAuth, requireRole("admin"), createStudent);
router.put("/:id", verifyAuth, requireRole("admin", "teacher", "student"), updateStudent);
router.delete("/:id", verifyAuth, requireRole("admin"), deleteStudent);

export default router;