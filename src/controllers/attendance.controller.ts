import { Request, Response } from "express";
import Attendance from "../models/Attendance.model";

// GET /api/attendance?className=Class 8&section=B&date=2026-08-27
export async function getAttendanceByClassDate(req: Request, res: Response) {
  try {
    const { className, section, date } = req.query;
    const filter: any = {};
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (date) filter.date = date;

    const records = await Attendance.find(filter).sort({ studentName: 1 });
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch attendance" });
  }
}

// POST /api/attendance/bulk
// body: { className, section, date, entries: [{ studentId, studentName, status }] }
export async function bulkMarkAttendance(req: Request, res: Response) {
  try {
    const { className, section, date, entries } = req.body;

    if (!className || !section || !date || !Array.isArray(entries)) {
      return res.status(400).json({ success: false, error: "Invalid payload" });
    }

    const ops = entries.map((entry: any) => ({
      updateOne: {
        filter: { studentId: entry.studentId, date },
        update: {
          $set: {
            studentId: entry.studentId,
            studentName: entry.studentName,
            className,
            section,
            date,
            status: entry.status,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(ops);
    res.status(200).json({ success: true, message: "Attendance saved" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to save attendance" });
  }
}