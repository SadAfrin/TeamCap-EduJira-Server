import { Request, Response } from "express";
import Subject from "../models/Subject.model";
import { buildIdOrCustomQuery } from "../lib/idHelper";

// GET /api/subjects
export async function getAllSubjects(req: Request, res: Response) {
  try {
    const { className, search, department } = req.query;
    const filter: Record<string, any> = {};

    if (className && className !== "All") {
      filter.className = className;
    }
    if (department && department !== "All") {
      filter.department = department;
    }
    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      filter.$or = [
        { name: searchRegex },
        { subjectCode: searchRegex },
        { teacherName: searchRegex },
        { className: searchRegex },
      ];
    }

    const subjects = await Subject.find(filter).sort({ className: 1, name: 1 });
    return res.json({ success: true, data: subjects, count: subjects.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch subjects" });
  }
}

// GET /api/subjects/:id
export async function getSubjectById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const subject = await Subject.findOne(buildIdOrCustomQuery(id, "subjectCode"));

    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    return res.json({ success: true, data: subject });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch subject" });
  }
}

// POST /api/subjects
export async function createSubject(req: Request, res: Response) {
  try {
    const { name, subjectCode, className, teacherName, teacherEmail, credits, department, description } = req.body;

    if (!name || !subjectCode || !className) {
      return res.status(400).json({ success: false, message: "Subject Name, Subject Code, and Class are required" });
    }

    const existing = await Subject.findOne({ subjectCode: subjectCode.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: `Subject with Code "${subjectCode}" already exists` });
    }

    const newSubject = await Subject.create({
      name: name.trim(),
      subjectCode: subjectCode.trim(),
      className: className.trim(),
      teacherName: teacherName || "",
      teacherEmail: teacherEmail || "",
      credits: credits || 3,
      department: department || "General",
      description: description || "",
    });

    return res.status(201).json({ success: true, message: "Subject created successfully", data: newSubject });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to create subject" });
  }
}

// PUT /api/subjects/:id
export async function updateSubject(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const updateData = req.body;

    const subject = await Subject.findOneAndUpdate(
      buildIdOrCustomQuery(id, "subjectCode"),
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    return res.json({ success: true, message: "Subject updated successfully", data: subject });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update subject" });
  }
}

// DELETE /api/subjects/:id
export async function deleteSubject(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const subject = await Subject.findOneAndDelete(buildIdOrCustomQuery(id, "subjectCode"));

    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    return res.json({ success: true, message: "Subject deleted successfully", data: subject });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete subject" });
  }
}
