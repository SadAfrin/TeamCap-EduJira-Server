import mongoose, { Schema, model, models } from "mongoose";

export interface IResult {
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  className: string;
  section?: string;
  subjectName: string;
  subjectCode?: string;
  term: string;
  year?: string | number;
  marks: number;
  grade: string;
  gpa: number;
  teacherRemarks?: string;
  aiNarrativeComment?: string;
  enteredBy?: string;
}

const ResultSchema = new Schema<IResult>(
  {
    studentId: { type: String, required: true, trim: true },
    studentName: { type: String, trim: true },
    studentEmail: { type: String, trim: true },
    className: { type: String, required: true, trim: true },
    section: { type: String, trim: true, default: "A" },
    subjectName: { type: String, required: true, trim: true },
    subjectCode: { type: String, trim: true },
    term: { type: String, required: true, default: "Final Term" },
    year: { type: Schema.Types.Mixed, default: new Date().getFullYear().toString() },
    marks: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, required: true, default: "A" },
    gpa: { type: Number, required: true, default: 4.0 },
    teacherRemarks: { type: String, default: "" },
    aiNarrativeComment: { type: String, default: "" },
    enteredBy: { type: String, trim: true },
  },
  { timestamps: true, collection: "results" }
);

export default models.Result || model<IResult>("Result", ResultSchema);
