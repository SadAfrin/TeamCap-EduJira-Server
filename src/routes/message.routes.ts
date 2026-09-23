import { Router } from "express";
import {
  getThreads,
  createOrGetThread,
  sendMessage,
} from "../controllers/message.controller";
import { verifyAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyAuth);

router.get("/threads", getThreads);
router.post("/threads", createOrGetThread);
router.post("/threads/:id/send", sendMessage);

export default router;
