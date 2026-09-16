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

const router = Router();

// Resolve logged-in parent by email (must be registered before /:id)
router.get("/me", getOrCreateParentByEmail);

// Search students endpoint for Parent UI dropdown
router.get("/search-students", searchStudentsForParent);

// Child Approval Workflows
router.post("/approve-child", approveChildLink);
router.post("/reject-child", rejectChildLink);

// Parent CRUD & Child Endpoints
router.get("/", getAllParents);
router.get("/:id", getParentById);
router.get("/:id/children", getParentChildren);
router.post("/:id/link-child", linkChildToParent);
router.post("/", createParent);
router.put("/:id", updateParent);
router.delete("/:id", deleteParent);

export default router;