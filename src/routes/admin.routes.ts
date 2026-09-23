import { Router } from "express";
import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../controllers/admin.controller";
import { verifyAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// Protect all admin endpoints - requires active login and Admin role
router.use(verifyAuth, requireRole("admin"));

router.get("/", getAllAdmins);
router.get("/:id", getAdminById);
router.post("/", createAdmin);
router.put("/:id", updateAdmin);
router.delete("/:id", deleteAdmin);

export default router;
