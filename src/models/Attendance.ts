import mongoose, { Document, Schema, model } from "mongoose";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "excused"
  | "half_day";

export interface IAttendance extends Document {
  studentId: string;
  studentName: string;
  rollNumber?: string;
  className: string;
  section?: string;
  date: Date;
  dateString: string; // YYYY-MM-DD format for easy querying
  status: AttendanceStatus;
  subject?: string;
  markedBy: string;
  remarks?: string;
  academicYear?: string;
  term?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: String, required: true, trim: true, index: true },
    studentName: { type: String, required: true, trim: true },
    rollNumber: { type: String, trim: true },
    className: { type: String, required: true, trim: true, index: true },
    section: { type: String, trim: true },
    date: { type: Date, required: true, index: true },
    dateString: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ["present", "absent", "late", "excused", "half_day"],
      default: "present",
    },
    subject: { type: String, trim: true, default: "General" },
    markedBy: { type: String, required: true, trim: true },
    remarks: { type: String, trim: true },
    academicYear: { type: String, trim: true },
    term: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: One attendance per student, per date, per subject
AttendanceSchema.index(
  { studentId: 1, dateString: 1, subject: 1 },
  { unique: true }
);

// Indexes for common queries
AttendanceSchema.index({ className: 1, section: 1, dateString: 1 });
AttendanceSchema.index({ studentId: 1, date: 1 });
AttendanceSchema.index({ status: 1 });

export const Attendance = model<IAttendance>("Attendance", AttendanceSchema);
