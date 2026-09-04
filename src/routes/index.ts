import { Router } from "express";
import eventRoutes from "./event.routes";
import timetableRoutes from "./timetable.routes";
import attendanceRoutes from "./attendance.routes";

const router = Router();

router.use("/calendar", eventRoutes);
router.use("/timetable", timetableRoutes);
router.use("/attendance", attendanceRoutes);

export default router;
