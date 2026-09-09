import { Request, Response } from "express";
import Assignment, { ISubmission } from "../models/Assignment.model";
import { sendNotificationAndEmit } from "../lib/socket";

// GET /api/assignments
export async function getAllAssignments(req: Request, res: Response) {
  try {
    const { className, section, subjectName, teacherEmail, studentId } = req.query;
    const filter: Record<string, any> = {};

    if (className && className !== "All") filter.className = className;
    if (section && section !== "All") filter.section = { $in: [section, "All"] };
    if (subjectName && subjectName !== "All") filter.subjectName = subjectName;
    if (teacherEmail) filter.teacherEmail = teacherEmail;

    const assignments = await Assignment.find(filter).sort({ createdAt: -1 });

    // If studentId passed, attach student's specific submission status
    if (studentId) {
      const mapped = assignments.map((a) => {
        const mySubmission = a.submissions.find((s: ISubmission) => s.studentId === studentId);
        return {
          ...a.toObject(),
          mySubmission: mySubmission || null,
          hasSubmitted: !!mySubmission,
        };
      });
      return res.json({ success: true, data: mapped, count: mapped.length });
    }

    return res.json({ success: true, data: assignments, count: assignments.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch assignments" });
  }
}

// POST /api/assignments - Create new assignment
export async function createAssignment(req: Request, res: Response) {
  try {
    const {
      title,
      description,
      className,
      section,
      subjectName,
      teacherName,
      teacherEmail,
      deadline,
      totalMarks,
      attachmentUrl,
    } = req.body;

    if (!title || !description || !className || !subjectName || !deadline) {
      return res.status(400).json({ success: false, message: "Missing required assignment fields" });
    }

    const assignment = await Assignment.create({
      title,
      description,
      className,
      section: section || "All",
      subjectName,
      teacherName: teacherName || "Subject Teacher",
      teacherEmail: teacherEmail || "",
      deadline,
      totalMarks: Number(totalMarks) || 100,
      attachmentUrl: attachmentUrl || "",
      submissions: [],
    });

    // Notify students of this class
    await sendNotificationAndEmit({
      recipientId: "student",
      recipientRole: "student",
      type: "assignment",
      title: `New Assignment: ${title}`,
      message: `${subjectName} - Deadline: ${deadline}. Total marks: ${totalMarks || 100}.`,
      link: "/dashboard/student/assignments",
      room: `class_${className}`,
    });

    return res.status(201).json({ success: true, message: "Assignment published", data: assignment });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to create assignment" });
  }
}

// POST /api/assignments/:id/submit - Student submit
export async function submitAssignment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { studentId, studentName, studentEmail, submissionText, fileUrl } = req.body;

    if (!studentId || (!submissionText && !fileUrl)) {
      return res.status(400).json({ success: false, message: "Student ID and content/file are required" });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    // Check if already submitted
    const existingIndex = assignment.submissions.findIndex((s: ISubmission) => s.studentId === studentId);
    const submissionObj: ISubmission = {
      studentId,
      studentName: studentName || "Student",
      studentEmail: studentEmail || "",
      submissionText: submissionText || "",
      fileUrl: fileUrl || "",
      submittedAt: new Date(),
      status: "submitted",
    };

    if (existingIndex > -1) {
      assignment.submissions[existingIndex] = {
        ...assignment.submissions[existingIndex],
        ...submissionObj,
      };
    } else {
      assignment.submissions.push(submissionObj);
    }

    await assignment.save();

    return res.json({ success: true, message: "Assignment submitted successfully", data: assignment });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to submit assignment" });
  }
}

// POST /api/assignments/:id/grade - Teacher grade submission
export async function gradeSubmission(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { studentId, marksObtained, feedback } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    const sub = assignment.submissions.find((s: ISubmission) => s.studentId === studentId);
    if (!sub) {
      return res.status(404).json({ success: false, message: "Student submission not found" });
    }

    sub.marksObtained = Number(marksObtained);
    sub.feedback = feedback || "";
    sub.status = "graded";

    await assignment.save();

    // Notify student
    if (sub.studentEmail) {
      await sendNotificationAndEmit({
        recipientId: sub.studentEmail,
        recipientRole: "student",
        type: "assignment",
        title: `Assignment Graded: ${assignment.title}`,
        message: `Marks: ${marksObtained}/${assignment.totalMarks}. Feedback: ${feedback || "Good effort!"}`,
        link: "/dashboard/student/assignments",
      });
    }

    return res.json({ success: true, message: "Submission graded", data: assignment });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to grade submission" });
  }
}

// DELETE /api/assignments/:id
export async function deleteAssignment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await Assignment.findByIdAndDelete(id);
    return res.json({ success: true, message: "Assignment deleted" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete assignment" });
  }
}
