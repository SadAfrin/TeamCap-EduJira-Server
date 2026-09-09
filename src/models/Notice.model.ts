import mongoose, { Schema, model, models } from "mongoose";

export interface INotice {
  title: string;
  body: string;
  targetType: "all" | "class" | "role";
  className?: string;
  targetRole?: "all" | "admin" | "teacher" | "student" | "parent";
  category: "Academic" | "Event" | "Holiday" | "Urgent" | "General";
  priority: "normal" | "high" | "urgent";
  createdBy: string;
  isDeleted: boolean;
  translations?: Record<string, { title: string; body: string }>;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    targetType: {
      type: String,
      enum: ["all", "class", "role"],
      default: "all",
    },
    className: { type: String, trim: true, default: "" },
    targetRole: {
      type: String,
      enum: ["all", "admin", "teacher", "student", "parent"],
      default: "all",
    },
    category: {
      type: String,
      enum: ["Academic", "Event", "Holiday", "Urgent", "General"],
      default: "General",
    },
    priority: {
      type: String,
      enum: ["normal", "high", "urgent"],
      default: "normal",
    },
    createdBy: { type: String, required: true, default: "Admin Office" },
    isDeleted: { type: Boolean, default: false },
    translations: { type: Map, of: Object, default: {} },
  },
  { timestamps: true, collection: "notices" }
);

export default models.Notice || model<INotice>("Notice", NoticeSchema);
