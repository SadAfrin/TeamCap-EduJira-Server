import mongoose, { Document, Schema, model, models } from "mongoose";

export interface IEvent extends Document {
  customId?: string;
  title: string;
  description?: string;
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  startDate: Date;
  endDate: Date;
  category: string;
  calendarId: string;
  targetRoles: string[];
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
    customId: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: String, trim: true },
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    category: {
      type: String,
      default: "event",
    },
    calendarId: {
      type: String,
      default: "cal-academic",
      trim: true,
    },
    targetRoles: {
      type: [String],
      default: ["admin", "teacher", "student", "parent"],
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

// Pre-save hook to ensure startDate and endDate are always populated
EventSchema.pre("save", function () {
  const self = this as any;
  if (!self.startDate) {
    if (self.date && self.startTime) {
      const parsed = new Date(`${self.date}T${self.startTime}:00`);
      self.startDate = isNaN(parsed.getTime()) ? new Date(self.date) : parsed;
    } else if (self.date) {
      self.startDate = new Date(self.date);
    } else {
      self.startDate = new Date();
    }
  }

  if (!self.endDate) {
    if (self.date && self.endTime) {
      const parsed = new Date(`${self.date}T${self.endTime}:00`);
      self.endDate = isNaN(parsed.getTime()) ? new Date(self.startDate.getTime() + 60 * 60 * 1000) : parsed;
    } else {
      self.endDate = new Date(self.startDate.getTime() + 60 * 60 * 1000);
    }
  }

  if (!self.date && self.startDate) {
    self.date = self.startDate.toISOString().split("T")[0];
  }
});

// Indexing for performance when querying events
EventSchema.index({ startDate: 1, endDate: 1 });
EventSchema.index({ date: 1 });
EventSchema.index({ calendarId: 1 });
EventSchema.index({ targetRoles: 1 });
EventSchema.index({ courseCode: 1 });

export const Event = models.Event || model<IEvent>("Event", EventSchema);
export default Event;

