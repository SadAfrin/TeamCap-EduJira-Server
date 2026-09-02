import mongoose, { Schema, model, models } from "mongoose";

export interface IAttendance {
  studentId: string; // can be string studentId or ObjectId
  studentName: string;
  className: string;
  section: string;
  date: string; // "YYYY-MM-DD"
  status: "Present" | "Absent" | "Late" | "Informed";
  remarks?: string;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: String, required: true },
    studentName: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Informed"],
      required: true,
    },
    remarks: { type: String },
  },
  { timestamps: true, collection: "attendances" }
);

AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ className: 1, section: 1, date: 1 });

export default models.Attendance || model<IAttendance>("Attendance", AttendanceSchema);