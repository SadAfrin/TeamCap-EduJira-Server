import { Request, Response } from "express";
import Attendance from "../models/Attendance.model";

// GET /api/attendance?className=Class 8&section=B&date=2026-08-27
export async function getAttendanceByClassDate(req: Request, res: Response) {
  try {
    const { className, section, date, studentId } = req.query;
    const filter: any = {};
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (date) filter.date = date;
    if (studentId) filter.studentId = studentId;

    const records = await Attendance.find(filter).sort({ date: -1, studentName: 1 });
    return res.status(200).json({ success: true, data: records, count: records.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch attendance" });
  }
}

// POST /api/attendance/bulk
// body: { className, section, date, entries: [{ studentId, studentName, status }] }
export async function bulkMarkAttendance(req: Request, res: Response) {
  try {
    const { className, section, date, entries } = req.body;

    if (!className || !section || !date || !Array.isArray(entries)) {
      return res.status(400).json({ success: false, message: "Invalid payload: className, section, date and entries are required" });
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

    if (ops.length > 0) {
      await Attendance.bulkWrite(ops);
    }
    return res.status(200).json({ success: true, message: `Attendance saved for ${ops.length} students` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to save attendance" });
  }
}