import { Request, Response } from "express";
import Admin from "../models/Admin.model";

// GET /api/admins
export async function getAllAdmins(req: Request, res: Response) {
  try {
    const { search, status } = req.query;
    const filter: Record<string, any> = {};

    if (status && status !== "All") {
      filter.status = status;
    }
    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      filter.$or = [
        { name: searchRegex },
        { adminId: searchRegex },
        { email: searchRegex },
        { designation: searchRegex },
      ];
    }

    const admins = await Admin.find(filter).sort({ name: 1 });
    return res.json({ success: true, data: admins, count: admins.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch admins" });
  }
}

// GET /api/admins/:id
export async function getAdminById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const admin = await Admin.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { adminId: id }, { email: id }],
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    return res.json({ success: true, data: admin });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch admin" });
  }
}

// POST /api/admins
export async function createAdmin(req: Request, res: Response) {
  try {
    const { adminId, name, email, phone, designation, permissions, status } = req.body;

    if (!adminId || !name || !email) {
      return res.status(400).json({ success: false, message: "Admin ID, Name, and Email are required" });
    }

    const existingId = await Admin.findOne({ adminId });
    if (existingId) {
      return res.status(409).json({ success: false, message: `Admin ID "${adminId}" already exists` });
    }

    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: `Email "${email}" is already in use by another admin` });
    }

    const admin = await Admin.create({
      adminId,
      name,
      email,
      phone: phone || "",
      designation: designation || "System Administrator",
      permissions: Array.isArray(permissions) ? permissions : ["all"],
      status: status || "Active",
    });

    return res.status(201).json({ success: true, message: "Admin created successfully", data: admin });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to create admin" });
  }
}

// PUT /api/admins/:id
export async function updateAdmin(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const updateData = req.body;

    const admin = await Admin.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { adminId: id }] },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    return res.json({ success: true, message: "Admin updated successfully", data: admin });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update admin" });
  }
}

// DELETE /api/admins/:id
export async function deleteAdmin(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const admin = await Admin.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { adminId: id }],
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    return res.json({ success: true, message: "Admin deleted successfully", data: admin });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete admin" });
  }
}
