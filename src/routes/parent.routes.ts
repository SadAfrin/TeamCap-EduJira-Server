import { Router } from "express";
import {
  getAllParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent,
  getParentChildren,
  searchStudentsForParent,
  linkChildToParent,
  approveChildLink,
  rejectChildLink,
  getOrCreateParentByEmail,
} from "../controllers/parent.controller";
import { verifyAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// Protect all parent routes
router.use(verifyAuth);

// Resolve logged-in parent by email (must be registered before /:id)
router.get("/me", getOrCreateParentByEmail);

// Search students endpoint for Parent UI dropdown
router.get("/search-students", searchStudentsForParent);

// Child Approval Workflows (Admin only)
router.post("/approve-child", requireRole("admin"), approveChildLink);
router.post("/reject-child", requireRole("admin"), rejectChildLink);

// Parent CRUD & Child Endpoints
router.get("/", requireRole("admin", "teacher"), getAllParents);
router.get("/:id", getParentById);
router.get("/:id/children", getParentChildren);
router.post("/:id/link-child", linkChildToParent);
router.post("/", requireRole("admin"), createParent);
router.put("/:id", updateParent);
router.delete("/:id", requireRole("admin"), deleteParent);

export default router;