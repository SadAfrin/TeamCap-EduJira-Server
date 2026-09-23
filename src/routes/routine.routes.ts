import { Router } from "express";
import {
  getRoutines,
  createOrUpdateRoutine,
  deleteRoutine,
} from "../controllers/routine.controller";
import { verifyAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyAuth);

router.get("/", getRoutines);
router.post("/", requireRole("admin", "teacher"), createOrUpdateRoutine);
router.delete("/:id", requireRole("admin"), deleteRoutine);

export default router;
