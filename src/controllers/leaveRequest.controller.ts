import { Request, Response } from "express";
import mongoose from "mongoose";
import LeaveRequest from "../models/LeaveRequest.model";
import Student from "../models/Student.model";
import Parent from "../models/Parent.model";
import Admin from "../models/Admin.model";
import Teacher from "../models/Teacher.model";
import {
  sendLeaveStatusEmail,
  sendLeaveSubmittedEmail,
} from "../services/notificationService";
import { findAuthUserById } from "../lib/auth";

async function resolveStudent(studentId: string) {
  if (mongoose.Types.ObjectId.isValid(studentId)) {
    const byId = await Student.findById(studentId);
    if (byId) return byId;
  }
  return Student.findOne({ studentId });
}

async function safeEmail(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (error) {
    console.error("Notification email failed:", error);
  }
}

/**
 * POST /api/leave
 * Create a new leave request (parent/student role)
 */
export async function createLeaveRequest(req: Request, res: Response) {
  try {
    const { studentId, startDate, endDate, reason, documentUrl } = req.body;
    const parentId = req.user?.id;

    if (!studentId || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: studentId, startDate, endDate, reason",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return res.status(400).json({
        success: false,
        error: "Start date must be before end date",
      });
    }

    const student = await resolveStudent(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    const leaveRequest = new LeaveRequest({
      studentId: student._id,
      parentId,
      startDate,
      endDate,
      reason,
      documentUrl: documentUrl || null,
      status: "submitted",
    });

    await leaveRequest.save();

    const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
    const reviewUrl = `${clientUrl}/teacher/leave-requests`;
    const parentName = req.user?.name || "Parent";

    const [admins, teachers] = await Promise.all([
      Admin.find({ status: { $ne: "Inactive" } }).limit(10),
      Teacher.find({ status: { $ne: "Resigned" } }).limit(10),
    ]);

    const notifyEmails = new Set<string>();
    admins.forEach((a: { email?: string }) => a.email && notifyEmails.add(a.email));
    teachers.forEach((t: { email?: string }) => t.email && notifyEmails.add(t.email));

    await Promise.all(
      [...notifyEmails].map((email) =>
        safeEmail(() =>
          sendLeaveSubmittedEmail(
            email,
            student.name,
            parentName,
            reason,
            startDate,
            endDate,
            reviewUrl
          )
        )
      )
    );

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
 */
export async function listLeaveRequests(req: Request, res: Response) {
  try {
    const { studentId, status } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const filter: Record<string, unknown> = {};

    if (userRole === "parent") {
      filter.parentId = userId;
    } else if (userRole === "teacher") {
      // Teachers see pending/reviewed requests (class filter can be added later)
    } else if (userRole !== "admin") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

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
    const teacherName = req.user?.name || "Teacher";

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status must be 'approved' or 'rejected'",
      });
    }

    const request = await LeaveRequest.findById(id).populate(
      "studentId",
      "name studentId className section"
    );
    if (!request) {
      return res.status(404).json({ success: false, error: "Leave request not found" });
    }

    request.teacherReview = {
      reviewedBy: teacherId,
      reviewedAt: new Date(),
      comments,
      status,
    };
    request.status = status === "approved" ? "teacher_approved" : "teacher_rejected";

    await request.save();

    const leaveStatus = request.status as
      | "teacher_approved"
      | "teacher_rejected"
      | "admin_approved"
      | "admin_rejected";

    const parentAuthUser = await findAuthUserById(request.parentId);
    const parentRecord = parentAuthUser?.email
      ? await Parent.findOne({ email: String(parentAuthUser.email).toLowerCase() })
      : null;
    const parentEmail = parentAuthUser?.email || parentRecord?.email;
    const parentName =
      (parentAuthUser as { name?: string } | null)?.name || parentRecord?.name || "Parent";
    const studentName =
      (request.studentId as { name?: string })?.name || "your child";

    if (parentEmail) {
      await safeEmail(() =>
        sendLeaveStatusEmail(
          String(parentEmail),
          parentName,
          studentName,
          leaveStatus,
          teacherName,
          comments
        )
      );
    }

    // Notify admins when teacher approves (ready for final decision)
    if (status === "approved") {
      const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
      const reviewUrl = `${clientUrl}/admin/leave-requests`;
      const admins = await Admin.find({ status: { $ne: "Inactive" } }).limit(10);
      await Promise.all(
        admins.map((admin: { email?: string }) =>
          admin.email
            ? safeEmail(() =>
                sendLeaveSubmittedEmail(
                  admin.email!,
                  studentName,
                  parentName,
                  request.reason,
                  request.startDate,
                  request.endDate,
                  reviewUrl
                )
              )
            : Promise.resolve()
        )
      );
    }

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
 * Admin makes final approval/rejection
 */
export async function approveLeaveRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const adminId = req.user?.id;
    const adminName = req.user?.name || "Administrator";

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status must be 'approved' or 'rejected'",
      });
    }

    const request = await LeaveRequest.findById(id).populate(
      "studentId",
      "name studentId className section"
    );
    if (!request) {
      return res.status(404).json({ success: false, error: "Leave request not found" });
    }

    if (!request.teacherReview || !request.teacherReview.status) {
      return res.status(400).json({
        success: false,
        error: "Request must be reviewed by teacher first",
      });
    }

    request.adminReview = {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      comments,
      status,
    };
    request.status = status === "approved" ? "admin_approved" : "admin_rejected";

    await request.save();

    const leaveStatus = request.status as
      | "teacher_approved"
      | "teacher_rejected"
      | "admin_approved"
      | "admin_rejected";

    const parentAuthUser = await findAuthUserById(request.parentId);
    const parentEmail = parentAuthUser?.email;
    const parentName = (parentAuthUser as { name?: string } | null)?.name || "Parent";
    const studentName =
      (request.studentId as { name?: string })?.name || "your child";

    if (parentEmail) {
      await safeEmail(() =>
        sendLeaveStatusEmail(
          String(parentEmail),
          parentName,
          studentName,
          leaveStatus,
          adminName,
          comments
        )
      );
    }

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

    if (userRole === "parent" && request.parentId !== userId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    if (request.status !== "submitted") {
      return res.status(400).json({
        success: false,
        error: "Can only cancel requests with 'submitted' status",
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
