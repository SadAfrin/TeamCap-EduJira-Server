import { Router } from "express";
import {
  getRoutines,
  createOrUpdateRoutine,
  deleteRoutine,
} from "../controllers/routine.controller";

const router = Router();

router.get("/", getRoutines);
router.post("/", createOrUpdateRoutine);
router.delete("/:id", deleteRoutine);

export default router;
