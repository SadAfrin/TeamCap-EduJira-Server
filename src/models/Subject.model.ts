import mongoose, { Schema, model, models } from "mongoose";

export interface ISubject {
  subjectCode: string;
  name: string;
  className: string;
  type?: "Core" | "Elective" | "Optional";
  credits?: number;
  teacherName?: string;
  description?: string;
}

const SubjectSchema = new Schema<ISubject>(
  {
    subjectCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["Core", "Elective", "Optional"],
      default: "Core",
    },
    credits: { type: Number, default: 3 },
    teacherName: { type: String, trim: true },
    description: { type: String },
  },
  { timestamps: true, collection: "subjects" }
);

export default models.Subject || model<ISubject>("Subject", SubjectSchema);
