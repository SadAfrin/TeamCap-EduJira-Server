import { Router } from "express";
import { requireRole, requireAuth } from "../middleware/auth.middleware";
import {
  createLeaveRequest,
  listLeaveRequests,
  getLeaveRequest,
  reviewLeaveRequest,
  approveLeaveRequest,
  cancelLeaveRequest,
} from "../controllers/leaveRequest.controller";

const router = Router();

// Create leave request (parent/student only)
router.post("/", requireRole(["parent", "student"]), createLeaveRequest);

// List leave requests (all authenticated users, filtered by role)
router.get("/", requireAuth, listLeaveRequests);

// Get single leave request
router.get("/:id", requireAuth, getLeaveRequest);

// Teacher reviews request (teacher only)
router.post("/:id/review", requireRole(["teacher"]), reviewLeaveRequest);

// Admin approves/rejects (admin only)
router.post("/:id/approve", requireRole(["admin"]), approveLeaveRequest);

// Cancel leave request (parent for own, admin for any)
router.delete("/:id", requireAuth, cancelLeaveRequest);

export default router;
