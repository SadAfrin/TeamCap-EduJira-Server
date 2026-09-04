import mongoose, { Schema, model, models } from "mongoose";

export interface IStudent {
  studentId: string;
  name: string;
  email?: string;
  phone?: string;
  className: string;
  section: string;
  roll?: number | string;
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: string;
  bloodGroup?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  address?: string;
  status?: "Active" | "Inactive" | "Graduated";
}

const StudentSchema = new Schema<IStudent>(
  {
    studentId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    className: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    roll: { type: Schema.Types.Mixed },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Male" },
    dateOfBirth: { type: String },
    bloodGroup: { type: String },
    parentName: { type: String, trim: true },
    parentEmail: { type: String, trim: true },
    parentPhone: { type: String, trim: true },
    address: { type: String },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Graduated"],
      default: "Active",
    },
  },
  { timestamps: true, collection: "students" }
);

export default models.Student || model<IStudent>("Student", StudentSchema);