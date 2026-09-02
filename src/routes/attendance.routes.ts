import { Router } from "express";
import {
  getAttendanceByClassDate,
  bulkMarkAttendance,
} from "../controllers/attendance.controller";

const router = Router();

router.get("/", getAttendanceByClassDate);
router.post("/bulk", bulkMarkAttendance);

export default router;