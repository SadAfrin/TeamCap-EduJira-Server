import { Router } from "express";
import {
  getAllLeaves,
  submitLeave,
  reviewLeave,
} from "../controllers/leave.controller";
import { verifyAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyAuth);

router.get("/", getAllLeaves);
router.post("/", submitLeave);
router.post("/:id/review", requireRole("admin", "teacher"), reviewLeave);

export default router;
