import mongoose, { Schema, model, models } from "mongoose";

export interface ILinkedChild {
  studentId: string;
  studentName: string;
  className: string;
  section: string;
  relationship?: string;
}

export interface IParent {
  parentId: string;
  name: string;
  email: string;
  phone?: string;
  occupation?: string;
  address?: string;
  children: ILinkedChild[];
  status?: "Active" | "Inactive";
}

const LinkedChildSchema = new Schema<ILinkedChild>(
  {
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    className: { type: String, required: true },
    section: { type: String, required: true },
    relationship: { type: String, default: "Guardian" },
  },
  { _id: false }
);

const ParentSchema = new Schema<IParent>(
  {
    parentId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    occupation: { type: String, trim: true },
    address: { type: String },
    children: { type: [LinkedChildSchema], default: [] },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true, collection: "parents" }
);

export default models.Parent || model<IParent>("Parent", ParentSchema);
