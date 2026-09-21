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

// Standard Student Management CRUD
router.get("/", verifyAuth, getAllStudents);
router.get("/:id", verifyAuth, getStudentById);
router.post("/", verifyAuth, requireRole("admin"), createStudent);
router.put("/:id", verifyAuth, requireRole("admin", "teacher"), updateStudent);
router.delete("/:id", verifyAuth, requireRole("admin"), deleteStudent);

export default router;