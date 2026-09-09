import { Router } from "express";
import {
  getThreads,
  createOrGetThread,
  sendMessage,
} from "../controllers/message.controller";

const router = Router();

router.get("/threads", getThreads);
router.post("/threads", createOrGetThread);
router.post("/threads/:id/send", sendMessage);

export default router;
