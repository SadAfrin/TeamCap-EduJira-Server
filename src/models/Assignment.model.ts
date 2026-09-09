import mongoose, { Schema, model, models } from "mongoose";

export interface ISubmission {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  submissionText?: string;
  fileUrl?: string;
  submittedAt: Date;
  marksObtained?: number;
  feedback?: string;
  status: "submitted" | "graded" | "late";
}

export interface IAssignment {
  title: string;
  description: string;
  className: string;
  section?: string;
  subjectName: string;
  teacherName: string;
  teacherEmail?: string;
  deadline: string;
  totalMarks: number;
  attachmentUrl?: string;
  submissions: ISubmission[];
}

const SubmissionSchema = new Schema<ISubmission>({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String },
  submissionText: { type: String },
  fileUrl: { type: String },
  submittedAt: { type: Date, default: Date.now },
  marksObtained: { type: Number },
  feedback: { type: String, default: "" },
  status: {
    type: String,
    enum: ["submitted", "graded", "late"],
    default: "submitted",
  },
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    className: { type: String, required: true, trim: true },
    section: { type: String, trim: true, default: "All" },
    subjectName: { type: String, required: true, trim: true },
    teacherName: { type: String, required: true, trim: true },
    teacherEmail: { type: String, trim: true },
    deadline: { type: String, required: true },
    totalMarks: { type: Number, required: true, default: 100 },
    attachmentUrl: { type: String, default: "" },
    submissions: { type: [SubmissionSchema], default: [] },
  },
  { timestamps: true, collection: "assignments" }
);

export default models.Assignment || model<IAssignment>("Assignment", AssignmentSchema);
