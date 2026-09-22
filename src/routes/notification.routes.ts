import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller";
import { verifyAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyAuth);

router.get("/", getNotifications);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);

export default router;
