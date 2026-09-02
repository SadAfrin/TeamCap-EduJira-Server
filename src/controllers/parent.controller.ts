import { Request, Response } from "express";
import Parent from "../models/Parent.model";
import Student from "../models/Student.model";

// GET /api/parents
export async function getAllParents(req: Request, res: Response) {
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
        { parentId: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { "children.studentName": searchRegex },
        { "children.studentId": searchRegex },
      ];
    }

    const parents = await Parent.find(filter).sort({ name: 1 });
    return res.json({ success: true, data: parents, count: parents.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch parents" });
  }
}

// GET /api/parents/:id
export async function getParentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parent = await Parent.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { parentId: id }, { email: id }],
    });

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    return res.json({ success: true, data: parent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch parent" });
  }
}

// POST /api/parents
export async function createParent(req: Request, res: Response) {
  try {
    const { parentId, name, email, phone, occupation, address, children, status } = req.body;

    if (!parentId || !name || !email) {
      return res.status(400).json({ success: false, message: "Parent ID, Name, and Email are required" });
    }

    const existingId = await Parent.findOne({ parentId });
    if (existingId) {
      return res.status(409).json({ success: false, message: `Parent ID "${parentId}" already exists` });
    }

    const parent = await Parent.create({
      parentId,
      name,
      email,
      phone: phone || "",
      occupation: occupation || "",
      address: address || "",
      children: Array.isArray(children) ? children : [],
      status: status || "Active",
    });

    return res.status(201).json({ success: true, message: "Parent created successfully", data: parent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to create parent" });
  }
}

// PUT /api/parents/:id
export async function updateParent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const parent = await Parent.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { parentId: id }] },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    return res.json({ success: true, message: "Parent updated successfully", data: parent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update parent" });
  }
}

// DELETE /api/parents/:id
export async function deleteParent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parent = await Parent.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { parentId: id }],
    });

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    return res.json({ success: true, message: "Parent deleted successfully", data: parent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete parent" });
  }
}

// POST /api/parents/:id/link-child - Link a student to a parent
export async function linkChildToParent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { studentId, relationship } = req.body;

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: `Student with ID "${studentId}" not found` });
    }

    const parent = await Parent.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { parentId: id }],
    });

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    // Check if already linked
    const alreadyLinked = parent.children.some((c: any) => c.studentId === studentId);
    if (alreadyLinked) {
      return res.status(400).json({ success: false, message: "This student is already linked to this parent" });
    }

    parent.children.push({
      studentId: student.studentId,
      studentName: student.name,
      className: student.className,
      section: student.section,
      relationship: relationship || "Guardian",
    });

    await parent.save();

    // Also update parentName in student record
    student.parentName = parent.name;
    student.parentEmail = parent.email;
    student.parentPhone = parent.phone;
    await student.save();

    return res.json({ success: true, message: "Child linked successfully", data: parent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to link child" });
  }
}
