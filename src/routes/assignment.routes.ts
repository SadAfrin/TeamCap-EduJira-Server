import { Router } from "express";
import {
  getAllAssignments,
  createAssignment,
  submitAssignment,
  gradeSubmission,
  deleteAssignment,
} from "../controllers/assignment.controller";

const router = Router();

router.get("/", getAllAssignments);
router.post("/", createAssignment);
router.post("/:id/submit", submitAssignment);
router.post("/:id/grade", gradeSubmission);
router.delete("/:id", deleteAssignment);

export default router;
