import { Router } from "express";
import {
  getAllAssignments,
  createAssignment,
  submitAssignment,
  gradeSubmission,
  deleteAssignment,
} from "../controllers/assignment.controller";
import { verifyAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyAuth);

router.get("/", getAllAssignments);
router.post("/", requireRole("admin", "teacher"), createAssignment);
router.post("/:id/submit", submitAssignment);
router.post("/:id/grade", requireRole("admin", "teacher"), gradeSubmission);
router.delete("/:id", requireRole("admin", "teacher"), deleteAssignment);

export default router;
