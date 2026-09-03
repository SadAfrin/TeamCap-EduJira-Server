import mongoose, { Document, Schema, model } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  category: "class" | "exam" | "assignment" | "holiday" | "event" | "other";
  location?: string;
  color?: string;
  courseCode?: string;
  isAllDay: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    category: {
      type: String,
      required: true,
      enum: ["class", "exam", "assignment", "holiday", "event", "other"],
      default: "class",
    },
    location: { type: String, trim: true },
    color: { type: String, trim: true },
    courseCode: { type: String, trim: true },
    isAllDay: { type: Boolean, default: false },
    createdBy: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Indexing for performance when querying events by date range
EventSchema.index({ startDate: 1, endDate: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ courseCode: 1 });

export const Event = model<IEvent>("Event", EventSchema);
