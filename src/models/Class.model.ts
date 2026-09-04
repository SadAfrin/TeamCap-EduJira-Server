import mongoose, { Schema, model, models } from "mongoose";

export interface IClass {
  className: string;
  gradeLevel?: number;
  sections: string[];
  subjects: string[];
  classTeacher?: string;
  roomNumber?: string;
  capacity?: number;
  description?: string;
}

const ClassSchema = new Schema<IClass>(
  {
    className: { type: String, required: true, unique: true, trim: true },
    gradeLevel: { type: Number },
    sections: { type: [String], default: ["A", "B"] },
    subjects: { type: [String], default: [] },
    classTeacher: { type: String, trim: true },
    roomNumber: { type: String, trim: true },
    capacity: { type: Number, default: 40 },
    description: { type: String },
  },
  { timestamps: true, collection: "classes" }
);

export default models.Class || model<IClass>("Class", ClassSchema);
