import mongoose, { Schema, model, models } from "mongoose";

export interface IEarlyWarningFlag {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  className: string;
  section: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  attendanceRate: number;
  averageMarks: number;
  reasons: string[];
  recommendedActions: string[];
  status: "active" | "reviewed" | "resolved";
  flaggedAt: Date;
  reviewedBy?: string;
}

const EarlyWarningFlagSchema = new Schema<IEarlyWarningFlag>(
  {
    studentId: { type: String, required: true, trim: true },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, trim: true },
    className: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    attendanceRate: { type: Number, default: 100 },
    averageMarks: { type: Number, default: 0 },
    reasons: { type: [String], default: [] },
    recommendedActions: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["active", "reviewed", "resolved"],
      default: "active",
    },
    flaggedAt: { type: Date, default: Date.now },
    reviewedBy: { type: String, default: "" },
  },
  { timestamps: true, collection: "early_warning_flags" }
);

export default models.EarlyWarningFlag ||
  model<IEarlyWarningFlag>("EarlyWarningFlag", EarlyWarningFlagSchema);
