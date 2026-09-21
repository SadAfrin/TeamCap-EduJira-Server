import { Router } from "express";
import {
  getAllNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  cacheTranslation,
} from "../controllers/notice.controller";
import { verifyAuth, requireRole, optionalAuth } from "../middleware/auth.middleware";

const router = Router();

// Public / Guest / Student read access
router.get("/", optionalAuth, getAllNotices);

// Write / Modify operations (Admin & Teacher only)
router.post("/", verifyAuth, requireRole("admin", "teacher"), createNotice);
router.put("/:id", verifyAuth, requireRole("admin", "teacher"), updateNotice);
router.delete("/:id", verifyAuth, requireRole("admin", "teacher"), deleteNotice);
router.post("/:id/translate-cache", verifyAuth, cacheTranslation);

export default router;
