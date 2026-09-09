import { Router } from "express";
import {
  getAllNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  cacheTranslation,
} from "../controllers/notice.controller";

const router = Router();

router.get("/", getAllNotices);
router.post("/", createNotice);
router.put("/:id", updateNotice);
router.delete("/:id", deleteNotice);
router.post("/:id/translate-cache", cacheTranslation);

export default router;
