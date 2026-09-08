import mongoose, { Schema, model, models } from "mongoose";

export interface IStudent {
  studentId: string;
  name: string;
  email?: string;
  phone?: string;
  desiredClass?: string;
  className?: string;
  section?: string;
  classId?: mongoose.Types.ObjectId | null;
  sectionId?: mongoose.Types.ObjectId | null;
  roll?: number | string;
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: string;
  bloodGroup?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  parentId?: mongoose.Types.ObjectId | null;
  address?: string;
  previousSchool?: string;
  previousGPA?: string;
  documents?: string[];
  rejectionReason?: string;
  status: "pending" | "approved" | "rejected" | "Active" | "Inactive" | "Graduated";
}

const StudentSchema = new Schema<IStudent>(
  {
    studentId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    desiredClass: { type: String, trim: true },
    className: { type: String, trim: true, default: "" },
    section: { type: String, trim: true, default: "" },
    classId: { type: Schema.Types.ObjectId, ref: "Class", default: null },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", default: null },
    roll: { type: Schema.Types.Mixed },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Male" },
    dateOfBirth: { type: String },
    bloodGroup: { type: String },
    parentName: { type: String, trim: true },
    parentEmail: { type: String, trim: true },
    parentPhone: { type: String, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Parent", default: null },
    address: { type: String },
    previousSchool: { type: String, trim: true },
    previousGPA: { type: String, trim: true },
    documents: { type: [String], default: [] },
    rejectionReason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "Active", "Inactive", "Graduated"],
      default: "pending",
    },
  },
  { timestamps: true, collection: "students" }
);

export default models.Student || model<IStudent>("Student", StudentSchema);