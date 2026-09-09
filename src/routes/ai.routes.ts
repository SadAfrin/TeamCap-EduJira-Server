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

const router = Router();

router.get("/early-warning", getEarlyWarningFlags);
router.post("/early-warning/run", runEarlyWarningAnalysis);
router.post("/narrative/generate", generateReportCardNarrative);
router.get("/attendance-patterns", analyzeAttendancePatterns);
router.post("/translate", translateNotice);
router.get("/resource-plan", planResourceAllocation);
router.get("/career-growth", trackCareerGrowth);
router.post("/tutor/chat", tutorChat);

export default router;
