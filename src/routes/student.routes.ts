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

const router = Router();

router.get("/classes", getClassOptions);
router.get("/pending", getPendingStudents);
router.get("/status", checkStudentStatus);
router.post("/register", registerStudent);
router.post("/:id/approve", approveStudent);
router.post("/:id/reject", rejectStudent);

router.get("/", getAllStudents);
router.get("/:id", getStudentById);
router.post("/", createStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

export default router;