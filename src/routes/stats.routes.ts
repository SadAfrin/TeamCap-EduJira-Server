import { Router } from "express";
import {
  getOverviewStats,
  getTeacherPortalStats,
  getStudentPortalStats,
  getParentPortalStats,
} from "../controllers/stats.controller";
import { verifyAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyAuth);

router.get("/overview", requireRole("admin"), getOverviewStats);
router.get("/teacher-portal", requireRole("admin", "teacher"), getTeacherPortalStats);
router.get("/student-portal", getStudentPortalStats);
router.get("/parent-portal", getParentPortalStats);

export default router;
