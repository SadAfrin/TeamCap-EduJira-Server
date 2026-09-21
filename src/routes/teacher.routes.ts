import { Router } from "express";
import {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from "../controllers/teacher.controller";
import { verifyAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyAuth);

router.get("/", getAllTeachers);
router.get("/:id", getTeacherById);
router.post("/", requireRole("admin"), createTeacher);
router.put("/:id", requireRole("admin"), updateTeacher);
router.delete("/:id", requireRole("admin"), deleteTeacher);

export default router;
