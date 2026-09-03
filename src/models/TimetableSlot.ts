import mongoose, { Document, Schema, model } from "mongoose";

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface ITimetableSlot extends Document {
  dayOfWeek: DayOfWeek;
  courseCode: string;
  courseName: string;
  teacherName: string;
  teacherId?: string;
  className?: string;
  section?: string;
  classCode?: string;
  startTime: string;
  endTime: string;
  room: string;
  color?: string;
  academicYear?: string;
  semester?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSlotSchema = new Schema<ITimetableSlot>(
  {
    dayOfWeek: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    courseCode: { type: String, required: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    teacherName: { type: String, required: true, trim: true },
    teacherId: { type: String, trim: true },
    className: { type: String, trim: true },
    section: { type: String, trim: true },
    classCode: { type: String, trim: true },
    startTime: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props: { value: string }) =>
          `${props.value} is not a valid time in HH:MM format!`,
      },
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props: { value: string }) =>
          `${props.value} is not a valid time in HH:MM format!`,
      },
    },
    room: { type: String, required: true, trim: true },
    color: { type: String, trim: true, default: "#3B82F6" },
    academicYear: { type: String, trim: true },
    semester: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast queries
TimetableSlotSchema.index({ classCode: 1, dayOfWeek: 1 });
TimetableSlotSchema.index({ className: 1, section: 1, dayOfWeek: 1 });
TimetableSlotSchema.index({ teacherName: 1, dayOfWeek: 1 });
TimetableSlotSchema.index({ teacherId: 1, dayOfWeek: 1 });
TimetableSlotSchema.index({ room: 1, dayOfWeek: 1 });

export const TimetableSlot = model<ITimetableSlot>(
  "TimetableSlot",
  TimetableSlotSchema
);
