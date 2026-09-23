import { Router } from "express";
import {
  getAllResults,
  getStudentTranscript,
  createOrUpdateResult,
  batchUpsertResults,
  deleteResult,
} from "../controllers/result.controller";
import { verifyAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyAuth);

router.get("/transcript", getStudentTranscript);
router.get("/", getAllResults);
router.post("/", requireRole("admin", "teacher"), createOrUpdateResult);
router.post("/batch", requireRole("admin", "teacher"), batchUpsertResults);
router.delete("/:id", requireRole("admin"), deleteResult);

export default router;
