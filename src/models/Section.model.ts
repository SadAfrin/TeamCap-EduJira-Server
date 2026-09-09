import mongoose, { Schema, model, models } from "mongoose";

export interface ISection {
  name: string;
  classId: mongoose.Types.ObjectId;
  className?: string;
  capacity: number;
  currentCount: number;
  roomNumber?: string;
}

const SectionSchema = new Schema<ISection>(
  {
    name: { type: String, required: true, trim: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    className: { type: String, trim: true },
    capacity: { type: Number, required: true, default: 40 },
    currentCount: { type: Number, default: 0 },
    roomNumber: { type: String, trim: true },
  },
  { timestamps: true, collection: "sections" }
);

export default models.Section || model<ISection>("Section", SectionSchema);
