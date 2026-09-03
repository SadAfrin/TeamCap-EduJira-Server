import { Request, Response } from "express";
import Subject from "../models/Subject.model";
import Class from "../models/Class.model";

// GET /api/subjects - List subjects with optional class and search filters
export async function getAllSubjects(req: Request, res: Response) {
  try {
    const { className, search } = req.query;
    const filter: Record<string, any> = {};

    if (className && className !== "All") {
      filter.className = className;
    }
    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      filter.$or = [
        { name: searchRegex },
        { subjectCode: searchRegex },
        { teacherName: searchRegex },
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
    const id = String(req.params.id);
    const subject = await Subject.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { subjectCode: id }],
    });

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
    const { subjectCode, name, className, type, credits, teacherName, description } = req.body;

    if (!subjectCode || !name || !className) {
      return res.status(400).json({ success: false, message: "Subject Code, Name, and Class are required" });
    }

    const existing = await Subject.findOne({ subjectCode });
    if (existing) {
      return res.status(409).json({ success: false, message: `Subject Code "${subjectCode}" already exists` });
    }

    const subject = await Subject.create({
      subjectCode,
      name,
      className,
      type: type || "Core",
      credits: credits || 3,
      teacherName: teacherName || "",
      description: description || "",
    });

    // Also link subject name to class if exists
    await Class.findOneAndUpdate(
      { className },
      { $addToSet: { subjects: name } }
    );

    return res.status(201).json({ success: true, message: "Subject created successfully", data: subject });
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
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { subjectCode: id }] },
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
    const id = String(req.params.id);
    const subject = await Subject.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { subjectCode: id }],
    });

    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    // Also remove from class
    await Class.findOneAndUpdate(
      { className: subject.className },
      { $pull: { subjects: subject.name } }
    );

    return res.json({ success: true, message: "Subject deleted successfully", data: subject });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete subject" });
  }
}
