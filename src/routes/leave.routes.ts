import { Router } from "express";
import {
  getAllLeaves,
  submitLeave,
  reviewLeave,
} from "../controllers/leave.controller";

const router = Router();

router.get("/", getAllLeaves);
router.post("/", submitLeave);
router.post("/:id/review", reviewLeave);

export default router;
