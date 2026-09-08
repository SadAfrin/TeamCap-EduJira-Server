import { Request, Response } from "express";
import Class from "../models/Class.model";
import Student from "../models/Student.model";
import Section from "../models/Section.model";
import { buildIdOrCustomQuery } from "../lib/idHelper";

// GET /api/classes
export async function getAllClasses(req: Request, res: Response) {
  try {
    const { search } = req.query;
    const filter: Record<string, any> = {};

    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      filter.$or = [
        { className: searchRegex },
        { classTeacher: searchRegex },
        { roomNumber: searchRegex },
      ];
    }

    const classes = await Class.find(filter).sort({ gradeLevel: 1, className: 1 });

    // Attach student count for each class
    const classesWithCount = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.countDocuments({ className: cls.className });
        const sectionsList = await Section.find({ className: cls.className });
        return {
          ...cls.toObject(),
          studentCount,
          sectionsCount: sectionsList.length || cls.sections?.length || 0,
        };
      })
    );

    return res.json({ success: true, data: classesWithCount, count: classes.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch classes" });
  }
}

// GET /api/classes/:id
export async function getClassById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const classItem = await Class.findOne(buildIdOrCustomQuery(id, "className"));

    if (!classItem) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const students = await Student.find({ className: classItem.className }).sort({ section: 1, roll: 1 });
    const sections = await Section.find({ className: classItem.className });

    return res.json({
      success: true,
      data: {
        ...classItem.toObject(),
        students,
        studentCount: students.length,
        sections,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch class" });
  }
}

// POST /api/classes
export async function createClass(req: Request, res: Response) {
  try {
    const { className, gradeLevel, sections, subjects, classTeacher, roomNumber, capacity, description } = req.body;

    if (!className) {
      return res.status(400).json({ success: false, message: "Class Name is required" });
    }

    const existing = await Class.findOne({ className: className.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: `Class "${className}" already exists` });
    }

    const secArray = Array.isArray(sections) && sections.length > 0 ? sections : ["A", "B"];

    const newClass = await Class.create({
      className: className.trim(),
      gradeLevel: gradeLevel || 1,
      sections: secArray,
      subjects: Array.isArray(subjects) ? subjects : [],
      classTeacher: classTeacher || "",
      roomNumber: roomNumber || "",
      capacity: capacity || 40,
      description: description || "",
    });

    // Also auto-create Section documents
    for (const secName of secArray) {
      await Section.create({
        name: secName,
        classId: newClass._id,
        className: newClass.className,
        capacity: capacity || 40,
        currentCount: 0,
        roomNumber: roomNumber || "",
      });
    }

    return res.status(201).json({ success: true, message: "Class created successfully", data: newClass });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to create class" });
  }
}

// PUT /api/classes/:id
export async function updateClass(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const classItem = await Class.findOneAndUpdate(
      buildIdOrCustomQuery(id, "className"),
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!classItem) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    return res.json({ success: true, message: "Class updated successfully", data: classItem });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update class" });
  }
}

// DELETE /api/classes/:id
export async function deleteClass(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const classItem = await Class.findOneAndDelete(buildIdOrCustomQuery(id, "className"));

    if (!classItem) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    await Section.deleteMany({ classId: classItem._id });

    return res.json({ success: true, message: "Class deleted successfully", data: classItem });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete class" });
  }
}
