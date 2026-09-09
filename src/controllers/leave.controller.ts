import { Request, Response } from "express";
import LeaveApplication from "../models/LeaveApplication.model";
import { sendNotificationAndEmit } from "../lib/socket";

// GET /api/leaves
export async function getAllLeaves(req: Request, res: Response) {
  try {
    const { studentId, studentEmail, parentEmail, className, section, status } = req.query;
    const filter: Record<string, any> = {};

    if (studentId) filter.studentId = studentId;
    if (studentEmail) filter.studentEmail = studentEmail;
    if (parentEmail) filter.parentEmail = parentEmail;
    if (className && className !== "All") filter.className = className;
    if (section && section !== "All") filter.section = section;
    if (status && status !== "All") filter.status = status;

    const leaves = await LeaveApplication.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: leaves, count: leaves.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch leaves" });
  }
}

// POST /api/leaves - Submit leave application
export async function submitLeave(req: Request, res: Response) {
  try {
    const {
      studentId,
      studentName,
      studentEmail,
      className,
      section,
      requestedBy,
      parentName,
      parentEmail,
      startDate,
      endDate,
      reason,
      doctorNoteUrl,
    } = req.body;

    if (!studentId || !studentName || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: "Missing required leave fields" });
    }

    // Calculate days
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const daysCount = Math.max(1, Math.round((end - start) / (1000 * 3600 * 24)) + 1);

    const leave = await LeaveApplication.create({
      studentId,
      studentName,
      studentEmail: studentEmail || "",
      className: className || "",
      section: section || "",
      requestedBy: requestedBy || "parent",
      parentName: parentName || "",
      parentEmail: parentEmail || "",
      startDate,
      endDate,
      daysCount,
      reason,
      doctorNoteUrl: doctorNoteUrl || "",
      status: "pending",
    });

    // Notify teachers & admin
    await sendNotificationAndEmit({
      recipientId: "teacher",
      recipientRole: "teacher",
      type: "leave",
      title: "New Leave Application",
      message: `${studentName} (${className || "Class"}) requested leave from ${startDate} to ${endDate}.`,
      link: "/dashboard/teacher/leaves",
    });

    return res.status(201).json({ success: true, message: "Leave application submitted", data: leave });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to submit leave" });
  }
}

// POST /api/leaves/:id/review - Approve or Reject
export async function reviewLeave(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, reviewRemarks, reviewedBy, reviewRole } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'approved' or 'rejected'" });
    }

    const leave = await LeaveApplication.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          reviewRemarks: reviewRemarks || "",
          reviewedBy: reviewedBy || "Staff",
          reviewRole: reviewRole || "teacher",
          reviewedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave application not found" });
    }

    // Notify student/parent
    const targetEmail = leave.studentEmail || leave.parentEmail;
    if (targetEmail) {
      await sendNotificationAndEmit({
        recipientId: targetEmail,
        type: "leave",
        title: `Leave Application ${status === "approved" ? "Approved ✅" : "Rejected ❌"}`,
        message: `Your leave request for ${leave.startDate} to ${leave.endDate} has been ${status}. Remarks: ${reviewRemarks || "None"}`,
        link: leave.requestedBy === "parent" ? "/dashboard/parent/leave-request" : "/dashboard/student",
      });
    }

    return res.json({ success: true, message: `Leave ${status} successfully`, data: leave });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to review leave" });
  }
}
