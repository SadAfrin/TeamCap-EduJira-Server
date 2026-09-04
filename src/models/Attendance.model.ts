import mongoose, { Schema, model, models } from "mongoose";

export type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Late"
  | "Informed"
  | "Excused"
  | "Half Day";

export interface IAttendance {
  studentId: string;
  studentName: string;
  rollNumber?: string;
  className: string;
  section: string;
  date: string; // "YYYY-MM-DD"
  status: AttendanceStatus;
  subject?: string;
  markedBy?: string;
  academicYear?: string;
  term?: string;
  remarks?: string;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: String, required: true, trim: true, index: true },
    studentName: { type: String, required: true, trim: true },
    rollNumber: { type: String, trim: true },
    className: { type: String, required: true, trim: true, index: true },
    section: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Informed", "Excused", "Half Day"],
      required: true,
      default: "Present",
    },
    subject: { type: String, trim: true, default: "General" },
    markedBy: { type: String, trim: true },
    academicYear: { type: String, trim: true },
    term: { type: String, trim: true },
    remarks: { type: String, trim: true },
  },
  { timestamps: true, collection: "attendances" }
);

AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ className: 1, section: 1, date: 1 });

export const Attendance =
  models.Attendance || model<IAttendance>("Attendance", AttendanceSchema);
export default Attendance;