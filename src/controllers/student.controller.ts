import { Request, Response } from "express";
import Student from "../models/Student.model";

// GET /api/students - List students with search, class, and section filters
export async function getAllStudents(req: Request, res: Response) {
  try {
    const { className, section, search } = req.query;
    const filter: Record<string, any> = {};

    if (className && className !== "All") {
      filter.className = className;
    }
    if (section && section !== "All") {
      filter.section = section;
    }
    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      filter.$or = [
        { name: searchRegex },
        { studentId: searchRegex },
        { email: searchRegex },
        { parentName: searchRegex },
      ];
    }

    const students = await Student.find(filter).sort({ className: 1, section: 1, roll: 1, name: 1 });
    return res.json({ success: true, data: students, count: students.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch students" });
  }
}

// GET /api/students/:id
export async function getStudentById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const student = await Student.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { studentId: id }] });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    return res.json({ success: true, data: student });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch student" });
  }
}

// POST /api/students - Create new student
export async function createStudent(req: Request, res: Response) {
  try {
    const { studentId, name, className, section, roll, email, phone, gender, bloodGroup, parentName, parentEmail, parentPhone, address, status } = req.body;

    if (!studentId || !name || !className || !section) {
      return res.status(400).json({ success: false, message: "Student ID, Name, Class, and Section are required" });
    }

    const existing = await Student.findOne({ studentId });
    if (existing) {
      return res.status(409).json({ success: false, message: `Student with ID "${studentId}" already exists` });
    }

    const newStudent = await Student.create({
      studentId,
      name,
      className,
      section,
      roll: roll || "",
      email: email || "",
      phone: phone || "",
      gender: gender || "Male",
      bloodGroup: bloodGroup || "",
      parentName: parentName || "",
      parentEmail: parentEmail || "",
      parentPhone: parentPhone || "",
      address: address || "",
      status: status || "Active",
    });

    return res.status(201).json({ success: true, message: "Student created successfully", data: newStudent });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to create student" });
  }
}

// PUT /api/students/:id - Update student
export async function updateStudent(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const updateData = req.body;

    const student = await Student.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { studentId: id }] },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.json({ success: true, message: "Student updated successfully", data: student });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update student" });
  }
}

// DELETE /api/students/:id - Delete student
export async function deleteStudent(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const student = await Student.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { studentId: id }],
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.json({ success: true, message: "Student deleted successfully", data: student });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete student" });
  }
}

// GET /api/students/classes - Get unique class & section combinations
export async function getClassOptions(req: Request, res: Response) {
  try {
    const students = await Student.find({}, "className section");
    const classMap: Record<string, Set<string>> = {};

    students.forEach((s) => {
      if (!classMap[s.className]) {
        classMap[s.className] = new Set();
      }
      classMap[s.className].add(s.section);
    });

    const result = Object.entries(classMap).map(([className, sections]) => ({
      className,
      sections: Array.from(sections).sort(),
    }));

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch class options" });
  }
}