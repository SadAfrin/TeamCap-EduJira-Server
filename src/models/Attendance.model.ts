import mongoose, { Schema, model, models } from "mongoose";

const AttendanceSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentName: { type: String, required: true }, // denormalized for quick display
    className: { type: String, required: true },
    section: { type: String, required: true },
    date: { type: String, required: true }, // store as "YYYY-MM-DD" for easy day-matching
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Informed"],
      required: true,
    },
  },
  { timestamps: true }
);

// One attendance record per student per day
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

export default models.Attendance || model("Attendance", AttendanceSchema);