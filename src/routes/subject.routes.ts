import { Router } from "express";
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/subject.controller";
import { verifyAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyAuth);

router.get("/", getAllSubjects);
router.get("/:id", getSubjectById);
router.post("/", requireRole("admin"), createSubject);
router.put("/:id", requireRole("admin"), updateSubject);
router.delete("/:id", requireRole("admin"), deleteSubject);

export default router;
