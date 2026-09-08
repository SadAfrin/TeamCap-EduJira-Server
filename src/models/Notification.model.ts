import mongoose, { Schema, model, models } from "mongoose";

export interface INotification {
  recipientId: string;
  recipientRole: "admin" | "teacher" | "student" | "parent" | "all";
  type:
    | "notice"
    | "leave"
    | "message"
    | "earlyWarning"
    | "assignment"
    | "grade"
    | "attendance"
    | "system";
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: String, required: true, trim: true },
    recipientRole: {
      type: String,
      enum: ["admin", "teacher", "student", "parent", "all"],
      default: "all",
    },
    type: {
      type: String,
      enum: [
        "notice",
        "leave",
        "message",
        "earlyWarning",
        "assignment",
        "grade",
        "attendance",
        "system",
      ],
      default: "system",
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    link: { type: String, default: "/dashboard" },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "notifications" }
);

export default models.Notification ||
  model<INotification>("Notification", NotificationSchema);
