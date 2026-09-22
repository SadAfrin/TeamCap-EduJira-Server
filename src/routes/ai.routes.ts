import { Router } from "express";
import {
  runEarlyWarningAnalysis,
  getEarlyWarningFlags,
  generateReportCardNarrative,
  analyzeAttendancePatterns,
  translateNotice,
  planResourceAllocation,
  trackCareerGrowth,
  tutorChat,
} from "../controllers/ai.controller";
import { verifyAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyAuth);

router.get("/early-warning", requireRole("admin", "teacher"), getEarlyWarningFlags);
router.post("/early-warning/run", requireRole("admin", "teacher"), runEarlyWarningAnalysis);
router.post("/narrative/generate", requireRole("admin", "teacher"), generateReportCardNarrative);
router.get("/attendance-patterns", requireRole("admin", "teacher"), analyzeAttendancePatterns);
router.post("/translate", translateNotice);
router.get("/resource-plan", requireRole("admin", "teacher"), planResourceAllocation);
router.get("/career-growth", requireRole("admin", "teacher"), trackCareerGrowth);
router.post("/tutor/chat", tutorChat);

export default router;
