import { Router } from "express";
import {
  getOverviewStats,
  getTeacherPortalStats,
  getStudentPortalStats,
  getParentPortalStats,
} from "../controllers/stats.controller";

const router = Router();

router.get("/overview", getOverviewStats);
router.get("/teacher-portal", getTeacherPortalStats);
router.get("/student-portal", getStudentPortalStats);
router.get("/parent-portal", getParentPortalStats);

export default router;
