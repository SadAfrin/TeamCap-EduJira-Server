import { Router } from "express";
import { logStudySession, getStudySessions } from "../controllers/study.controller";

const router = Router();

// POST: Used by the Next.js Focus Room timer when the student clicks "Stop"
router.post("/", logStudySession);

// GET: Used by your browser when you visit the URL
router.get("/", getStudySessions);

export default router;