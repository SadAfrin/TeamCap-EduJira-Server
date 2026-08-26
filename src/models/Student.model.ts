import mongoose, { Schema, model, models } from "mongoose";

const StudentSchema = new Schema(
  {
    studentId: { type: String, required: true, unique: true }, // e.g. "24-101"
    name: { type: String, required: true },
    className: { type: String, required: true }, // e.g. "Class 8"
    section: { type: String, required: true }, // e.g. "B"
  },
  { timestamps: true }
);

export default models.Student || model("Student", StudentSchema);