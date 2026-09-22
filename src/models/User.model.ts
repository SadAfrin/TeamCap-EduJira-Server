import mongoose, { Schema, model, models } from "mongoose";

export interface IAuthUser {
  id?: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  image?: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IAuthUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: { type: Boolean, default: false },
    image: { type: String },
    role: { type: String, default: "pending" },
  },
  {
    timestamps: true,
    collection: "user", // Matches Better-Auth collection
    strict: false,
  }
);

export default models.User || model<IAuthUser>("User", UserSchema);
