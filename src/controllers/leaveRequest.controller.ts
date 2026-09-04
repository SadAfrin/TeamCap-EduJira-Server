import { Request, Response } from "express";
import LeaveRequest from "../models/LeaveRequest.model";
import Student from "../models/Student.model";
import { sendLeaveStatusEmail, sendLeaveSubmittedEmail } from "../services/notificationService";

/**
 * POST /api/leave
 * Create a new leave request (parent/student role)
 */
export async function createLeaveRequest(req: Request, res: Response) {
  try {
    const { studentId, startDate, endDate, reason, documentUrl } = req.body;
    const parentId = req.user?.id;

    // Validation
    if (!studentId || !startDate || !endDate || !reason) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: studentId, startDate, endDate, reason" 
      });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return res.status(400).json({ 
        success: false, 
        error: "Start date must be before end date" 
      });
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    // Create leave request
    const leaveRequest = new LeaveRequest({
      studentId,
      parentId,
      startDate,
      endDate,
      reason,
      documentUrl: documentUrl || null,
      status: "submitted",
    });

    await leaveRequest.save();

    // TODO: Send email to teacher
    // sendLeaveSubmittedEmail(teacherEmail, student.name, req.user?.name, reason, startDate, endDate, reviewUrl);

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      data: leaveRequest,
    });
  } catch (error: unknown) {
    console.error("Error creating leave request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create leave request",
    });
  }
}

/**
 * GET /api/leave
 * List leave requests based on user role
 * - Parent: sees own child's requests
 * - Teacher: sees all students' requests (in their classes)
 * - Admin: sees all requests
 */
export async function listLeaveRequests(req: Request, res: Response) {
  try {
    const { studentId, status } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let filter: any = {};

    // Role-based filtering
    if (userRole === "parent") {
      filter.parentId = userId;
    } else if (userRole === "teacher") {
      // TODO: Filter by students in teacher's classes
      // For now, allow teachers to see all requests
    } else if (userRole !== "admin") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    // Apply additional filters
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    const requests = await LeaveRequest.find(filter)
      .populate("studentId", "name studentId className section")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: requests });
  } catch (error: unknown) {
    console.error("Error listing leave requests:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch leave requests",
    });
  }
}

/**
 * GET /api/leave/:id
 * Fetch a single leave request
 */
export async function getLeaveRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const request = await LeaveRequest.findById(id).populate(
      "studentId",
      "name studentId className section"
    );

    if (!request) {
      return res.status(404).json({ success: false, error: "Leave request not found" });
    }

    // Check authorization (only participants can view)
    const userRole = req.user?.role;
    const userId = req.user?.id;
    if (userRole === "parent" && request.parentId !== userId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    res.json({ success: true, data: request });
  } catch (error: unknown) {
    console.error("Error fetching leave request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch leave request",
    });
  }
}

/**
 * POST /api/leave/:id/review
 * Teacher reviews and approves/rejects leave request
 */
export async function reviewLeaveRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const teacherId = req.user?.id;
    const teacherName = req.user?.name;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: "Status must be 'approved' or 'rejected'" 
      });
    }

    const request = await LeaveRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, error: "Leave request not found" });
    }

    // Update with teacher review
    request.teacherReview = {
      reviewedBy: teacherId,
      reviewedAt: new Date(),
      comments,
      status,
    };
    request.status = status === "approved" ? "teacher_approved" : "teacher_rejected";

    await request.save();

    // TODO: Send email to parent
    // sendLeaveStatusEmail(parentEmail, parentName, studentName, status, teacherName, comments);

    res.json({
      success: true,
      message: `Leave request ${status}`,
      data: request,
    });
  } catch (error: unknown) {
    console.error("Error reviewing leave request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to review leave request",
    });
  }
}

/**
 * POST /api/leave/:id/approve
 * Admin makes final approval/rejection of teacher-reviewed request
 */
export async function approveLeaveRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const adminId = req.user?.id;
    const adminName = req.user?.name;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: "Status must be 'approved' or 'rejected'" 
      });
    }

    const request = await LeaveRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, error: "Leave request not found" });
    }

    // Verify it was teacher-reviewed first
    if (!request.teacherReview || !request.teacherReview.status) {
      return res.status(400).json({ 
        success: false, 
        error: "Request must be reviewed by teacher first" 
      });
    }

    // Update with admin review
    request.adminReview = {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      comments,
      status,
    };
    request.status = status === "approved" ? "admin_approved" : "admin_rejected";

    await request.save();

    // TODO: Send email to parent with final status
    // sendLeaveStatusEmail(parentEmail, parentName, studentName, request.status, adminName, comments);

    res.json({
      success: true,
      message: `Leave request ${status} by admin`,
      data: request,
    });
  } catch (error: unknown) {
    console.error("Error approving leave request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to approve leave request",
    });
  }
}

/**
 * DELETE /api/leave/:id
 * Cancel/delete a leave request (only if status is "submitted")
 */
export async function cancelLeaveRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const request = await LeaveRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, error: "Leave request not found" });
    }

    // Only parent can cancel their own submitted request, or admin can cancel any
    if (userRole === "parent" && request.parentId !== userId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    if (request.status !== "submitted") {
      return res.status(400).json({ 
        success: false, 
        error: "Can only cancel requests with 'submitted' status" 
      });
    }

    await LeaveRequest.deleteOne({ _id: id });

    res.json({
      success: true,
      message: "Leave request cancelled",
    });
  } catch (error: unknown) {
    console.error("Error cancelling leave request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel leave request",
    });
  }
}
