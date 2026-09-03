import { Request, Response } from "express";
import Class from "../models/Class.model";
import Student from "../models/Student.model";

// GET /api/classes - List all classes with student counts
export async function getAllClasses(req: Request, res: Response) {
  try {
    const classes = await Class.find().sort({ gradeLevel: 1, className: 1 });

    // Calculate student count per class and per section
    const studentStats = await Student.aggregate([
      {
        $group: {
          _id: { className: "$className", section: "$section" },
          count: { $sum: 1 },
        },
      },
    ]);

    const enrichedClasses = classes.map((cls) => {
      const clsObj = cls.toObject();
      let totalStudents = 0;
      const sectionCounts: Record<string, number> = {};

      cls.sections.forEach((sec: string) => {
        const found = studentStats.find(
          (s) => s._id.className === cls.className && s._id.section === sec
        );
        const count = found ? found.count : 0;
        sectionCounts[sec] = count;
        totalStudents += count;
      });

      return {
        ...clsObj,
        totalStudents,
        sectionCounts,
      };
    });

    return res.json({ success: true, data: enrichedClasses, count: enrichedClasses.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch classes" });
  }
}

// GET /api/classes/:id
export async function getClassById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const cls = await Class.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { className: id }],
    });

    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const students = await Student.find({ className: cls.className }).sort({ section: 1, roll: 1 });

    return res.json({ success: true, data: cls, students });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch class" });
  }
}

// POST /api/classes
export async function createClass(req: Request, res: Response) {
  try {
    const { className, gradeLevel, sections, subjects, classTeacher, roomNumber, capacity, description } = req.body;

    if (!className) {
      return res.status(400).json({ success: false, message: "Class name is required" });
    }

    const existing = await Class.findOne({ className });
    if (existing) {
      return res.status(409).json({ success: false, message: `Class "${className}" already exists` });
    }

    const newClass = await Class.create({
      className,
      gradeLevel: gradeLevel || parseInt(className.replace(/\D/g, ""), 10) || 1,
      sections: Array.isArray(sections) && sections.length > 0 ? sections : ["A", "B"],
      subjects: Array.isArray(subjects) ? subjects : [],
      classTeacher: classTeacher || "",
      roomNumber: roomNumber || "",
      capacity: capacity || 40,
      description: description || "",
    });

    return res.status(201).json({ success: true, message: "Class created successfully", data: newClass });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to create class" });
  }
}

// PUT /api/classes/:id
export async function updateClass(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const updateData = req.body;

    const cls = await Class.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { className: id }] },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    return res.json({ success: true, message: "Class updated successfully", data: cls });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update class" });
  }
}

// DELETE /api/classes/:id
export async function deleteClass(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const cls = await Class.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { className: id }],
    });

    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    return res.json({ success: true, message: "Class deleted successfully", data: cls });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete class" });
  }
}
