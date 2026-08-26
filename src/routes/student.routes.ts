import { Router } from "express";
import { getStudentsByClass, getClassOptions } from "../controllers/student.controller";

const router = Router();

router.get("/classes", getClassOptions);
router.get("/", getStudentsByClass);

export default router;