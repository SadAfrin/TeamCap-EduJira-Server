import mongoose, { Schema, Document } from "mongoose";

export interface IStudySession extends Document {
  studentId: mongoose.Types.ObjectId;
  subject: string;
  durationInMinutes: number;
  date: Date;
}

const StudySessionSchema: Schema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    durationInMinutes: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.StudySession || mongoose.model<IStudySession>("StudySession", StudySessionSchema);