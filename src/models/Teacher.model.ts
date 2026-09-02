import mongoose, { Schema, model, models } from "mongoose";

export interface ITeacher {
  teacherId: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  qualification?: string;
  gender?: "Male" | "Female" | "Other";
  subjectsAssigned: string[];
  classesAssigned: string[];
  joiningDate?: string;
  status?: "Active" | "On Leave" | "Resigned";
}

const TeacherSchema = new Schema<ITeacher>(
  {
    teacherId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    designation: { type: String, default: "Assistant Teacher", trim: true },
    qualification: { type: String, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Male" },
    subjectsAssigned: { type: [String], default: [] },
    classesAssigned: { type: [String], default: [] },
    joiningDate: { type: String },
    status: {
      type: String,
      enum: ["Active", "On Leave", "Resigned"],
      default: "Active",
    },
  },
  { timestamps: true, collection: "teachers" }
);

export default models.Teacher || model<ITeacher>("Teacher", TeacherSchema);
