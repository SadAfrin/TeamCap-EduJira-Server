import { Request, Response } from "express";
import Teacher from "../models/Teacher.model";

// GET /api/teachers
export async function getAllTeachers(req: Request, res: Response) {
  try {
    const { search, status, subject } = req.query;
    const filter: Record<string, any> = {};

    if (status && status !== "All") {
      filter.status = status;
    }
    if (subject && subject !== "All") {
      filter.subjectsAssigned = subject;
    }
    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      filter.$or = [
        { name: searchRegex },
        { teacherId: searchRegex },
        { email: searchRegex },
        { designation: searchRegex },
        { qualification: searchRegex },
      ];
    }

    const teachers = await Teacher.find(filter).sort({ name: 1 });
    return res.json({ success: true, data: teachers, count: teachers.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch teachers" });
  }
}

// GET /api/teachers/:id
export async function getTeacherById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { teacherId: id }, { email: id }],
    });

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    return res.json({ success: true, data: teacher });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch teacher" });
  }
}

// POST /api/teachers
export async function createTeacher(req: Request, res: Response) {
  try {
    const { teacherId, name, email, phone, designation, qualification, gender, subjectsAssigned, classesAssigned, joiningDate, status } = req.body;

    if (!teacherId || !name || !email) {
      return res.status(400).json({ success: false, message: "Teacher ID, Name, and Email are required" });
    }

    const existingId = await Teacher.findOne({ teacherId });
    if (existingId) {
      return res.status(409).json({ success: false, message: `Teacher ID "${teacherId}" already exists` });
    }

    const existingEmail = await Teacher.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: `Email "${email}" is already in use by another teacher` });
    }

    const teacher = await Teacher.create({
      teacherId,
      name,
      email,
      phone: phone || "",
      designation: designation || "Assistant Teacher",
      qualification: qualification || "",
      gender: gender || "Male",
      subjectsAssigned: Array.isArray(subjectsAssigned) ? subjectsAssigned : [],
      classesAssigned: Array.isArray(classesAssigned) ? classesAssigned : [],
      joiningDate: joiningDate || new Date().toISOString().split("T")[0],
      status: status || "Active",
    });

    return res.status(201).json({ success: true, message: "Teacher created successfully", data: teacher });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to create teacher" });
  }
}

// PUT /api/teachers/:id
export async function updateTeacher(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const teacher = await Teacher.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { teacherId: id }] },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    return res.json({ success: true, message: "Teacher updated successfully", data: teacher });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update teacher" });
  }
}

// DELETE /api/teachers/:id
export async function deleteTeacher(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { teacherId: id }],
    });

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    return res.json({ success: true, message: "Teacher deleted successfully", data: teacher });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete teacher" });
  }
}
