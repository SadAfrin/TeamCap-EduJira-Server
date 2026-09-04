import mongoose, { Schema, model, models } from "mongoose";

export type LeaveStatus = "submitted" | "teacher_approved" | "teacher_rejected" | "admin_approved" | "admin_rejected";

interface TeacherReview {
  reviewedBy?: string; // teacherId/email
  reviewedAt?: Date;
  comments?: string;
  status?: "approved" | "rejected";
}

interface AdminReview {
  reviewedBy?: string; // adminId/email
  reviewedAt?: Date;
  comments?: string;
  status?: "approved" | "rejected";
}

const LeaveRequestSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    parentId: { type: String, required: true }, // better-auth user ID
    startDate: { type: String, required: true }, // ISO date: YYYY-MM-DD
    endDate: { type: String, required: true }, // ISO date: YYYY-MM-DD
    reason: { type: String, required: true }, // required reason/description
    documentUrl: { type: String, default: null }, // optional medical certificate URL
    status: {
      type: String,
      enum: ["submitted", "teacher_approved", "teacher_rejected", "admin_approved", "admin_rejected"],
      default: "submitted",
      required: true,
    },
    teacherReview: {
      reviewedBy: String,
      reviewedAt: Date,
      comments: String,
      status: { type: String, enum: ["approved", "rejected"] },
    },
    adminReview: {
      reviewedBy: String,
      reviewedAt: Date,
      comments: String,
      status: { type: String, enum: ["approved", "rejected"] },
    },
  },
  { timestamps: true }
);

// Index for efficient queries
LeaveRequestSchema.index({ studentId: 1, startDate: 1 });
LeaveRequestSchema.index({ parentId: 1, createdAt: -1 });
LeaveRequestSchema.index({ status: 1 });

export default models.LeaveRequest || model("LeaveRequest", LeaveRequestSchema);
