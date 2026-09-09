import mongoose, { Schema, model, models } from "mongoose";

export interface IPeriodSlot {
  period: string;
  time: string;
  subject: string;
  teacher: string;
  teacherEmail?: string;
  room: string;
}

export interface IRoutine {
  className: string;
  section: string;
  day: string;
  periodSlots: IPeriodSlot[];
  academicYear?: string;
}

const PeriodSlotSchema = new Schema<IPeriodSlot>({
  period: { type: String, required: true },
  time: { type: String, required: true },
  subject: { type: String, required: true },
  teacher: { type: String, required: true },
  teacherEmail: { type: String },
  room: { type: String, required: true },
});

const RoutineSchema = new Schema<IRoutine>(
  {
    className: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    day: {
      type: String,
      required: true,
      enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
    periodSlots: { type: [PeriodSlotSchema], default: [] },
    academicYear: { type: String, default: new Date().getFullYear().toString() },
  },
  { timestamps: true, collection: "routines" }
);

export default models.Routine || model<IRoutine>("Routine", RoutineSchema);
