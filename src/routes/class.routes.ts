import { Router } from "express";
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
} from "../controllers/class.controller";
import { verifyAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyAuth);

router.get("/", getAllClasses);
router.get("/:id", getClassById);
router.post("/", requireRole("admin"), createClass);
router.put("/:id", requireRole("admin"), updateClass);
router.delete("/:id", requireRole("admin"), deleteClass);

export default router;
