import mongoose, { Document, Schema, model, models } from "mongoose";

export interface ICalendar extends Document {
  id?: string;
  customId?: string;
  name: string;
  color: "indigo" | "red" | "emerald" | "amber" | "purple" | "cyan";
  description: string;
  targetRoles: string[]; // ['admin', 'teacher', 'student', 'parent']
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarSchema = new Schema<ICalendar>(
  {
    customId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    color: {
      type: String,
      required: true,
      enum: ["indigo", "red", "emerald", "amber", "purple", "cyan"],
      default: "indigo",
    },
    description: { type: String, default: "", trim: true },
    targetRoles: {
      type: [String],
      default: ["admin", "teacher", "student", "parent"],
    },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const Calendar = models.Calendar || model<ICalendar>("Calendar", CalendarSchema);
export const CalendarCategory = Calendar;
export default Calendar;
