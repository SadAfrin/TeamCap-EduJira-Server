import { Router } from "express";
import {
  getAllResults,
  getStudentTranscript,
  createOrUpdateResult,
  batchUpsertResults,
  deleteResult,
} from "../controllers/result.controller";

const router = Router();

router.get("/transcript", getStudentTranscript);
router.get("/", getAllResults);
router.post("/", createOrUpdateResult);
router.post("/batch", batchUpsertResults);
router.delete("/:id", deleteResult);

export default router;
