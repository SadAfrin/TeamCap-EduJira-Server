import mongoose, { Schema, model, models } from "mongoose";

export interface ILeaveApplication {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  className: string;
  section: string;
  requestedBy: "student" | "parent";
  parentName?: string;
  parentEmail?: string;
  startDate: string;
  endDate: string;
  daysCount?: number;
  reason: string;
  doctorNoteUrl?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewRole?: "teacher" | "admin";
  reviewRemarks?: string;
  reviewedAt?: Date;
}

const LeaveApplicationSchema = new Schema<ILeaveApplication>(
  {
    studentId: { type: String, required: true, trim: true },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, trim: true },
    className: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    requestedBy: { type: String, enum: ["student", "parent"], default: "parent" },
    parentName: { type: String, trim: true },
    parentEmail: { type: String, trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    daysCount: { type: Number, default: 1 },
    reason: { type: String, required: true },
    doctorNoteUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: String, default: "" },
    reviewRole: { type: String, enum: ["teacher", "admin"] },
    reviewRemarks: { type: String, default: "" },
    reviewedAt: { type: Date },
  },
  { timestamps: true, collection: "leave_applications" }
);

export default models.LeaveApplication ||
  model<ILeaveApplication>("LeaveApplication", LeaveApplicationSchema);
