import mongoose, { Schema, model, models } from "mongoose";

export interface IAdmin {
  adminId: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  permissions?: string[];
  status?: "Active" | "Inactive";
}

const AdminSchema = new Schema<IAdmin>(
  {
    adminId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    designation: { type: String, default: "System Administrator", trim: true },
    permissions: { type: [String], default: ["all"] },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true, collection: "admins" }
);

export default models.Admin || model<IAdmin>("Admin", AdminSchema);
