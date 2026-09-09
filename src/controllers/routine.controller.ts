import { Request, Response } from "express";
import Routine from "../models/Routine.model";

// GET /api/routines
export async function getRoutines(req: Request, res: Response) {
  try {
    const { className, section, day, teacher } = req.query;
    const filter: Record<string, any> = {};

    if (className && className !== "All") filter.className = className;
    if (section && section !== "All") filter.section = section;
    if (day && day !== "All") filter.day = day;

    const routines = await Routine.find(filter);

    // If filtered by teacher name, filter period slots
    if (teacher) {
      const filtered = routines.map((r) => {
        const slots = r.periodSlots.filter((slot: any) =>
          slot.teacher.toLowerCase().includes(String(teacher).toLowerCase())
        );
        return { ...r.toObject(), periodSlots: slots };
      });
      return res.json({ success: true, data: filtered });
    }

    return res.json({ success: true, data: routines });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch routines" });
  }
}

// POST /api/routines - Create or replace routine for day
export async function createOrUpdateRoutine(req: Request, res: Response) {
  try {
    const { className, section, day, periodSlots, academicYear } = req.body;
    if (!className || !section || !day || !Array.isArray(periodSlots)) {
      return res.status(400).json({ success: false, message: "className, section, day and periodSlots required" });
    }

    const routine = await Routine.findOneAndUpdate(
      { className, section, day },
      { $set: { periodSlots, academicYear: academicYear || new Date().getFullYear().toString() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ success: true, message: "Routine updated successfully", data: routine });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to save routine" });
  }
}

// DELETE /api/routines/:id
export async function deleteRoutine(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await Routine.findByIdAndDelete(id);
    return res.json({ success: true, message: "Routine deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete routine" });
  }
}
