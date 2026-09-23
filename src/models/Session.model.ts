import mongoose, { Schema, model, models } from "mongoose";

export interface IAuthSession {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SessionSchema = new Schema<IAuthSession>(
  {
    userId: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
    collection: "session", // Matches Better-Auth collection
    strict: false,
  }
);

export default models.Session || model<IAuthSession>("Session", SessionSchema);
