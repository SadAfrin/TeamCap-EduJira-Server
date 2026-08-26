import { Request, Response } from "express";
import Student from "../models/Student.model";

// GET /api/students?className=Class 8&section=B
export async function getStudentsByClass(req: Request, res: Response) {
  try {
    const { className, section } = req.query;
    if (!className || !section) {
      return res.status(400).json({ success: false, error: "className and section are required" });
    }
    const students = await Student.find({ className, section }).sort({ studentId: 1 });
    res.status(200).json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch students" });
  }
}

// GET /api/students/classes -> distinct class/section pairs for the dropdowns
export async function getClassOptions(req: Request, res: Response) {
  try {
    const classes = await Student.distinct("className");
    const sections = await Student.distinct("section");
    res.status(200).json({ success: true, data: { classes, sections } });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch class options" });
  }
}