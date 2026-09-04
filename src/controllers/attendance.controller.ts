import { Request, Response, NextFunction } from "express";
import Attendance, { AttendanceStatus } from "../models/Attendance.model";
import mongoose from "mongoose";

// Normalize date to YYYY-MM-DD string
const normalizeDateString = (dateInput?: string | Date): string => {
  if (!dateInput) {
    return new Date().toISOString().split("T")[0];
  }
  if (typeof dateInput === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new Error("Invalid date format provided.");
  }
  return d.toISOString().split("T")[0];
};

// Normalize status to TitleCase matching AttendanceStatus
const normalizeStatus = (status?: string): AttendanceStatus => {
  if (!status) return "Present";
  const s = status.trim().toLowerCase();
  switch (s) {
    case "present":
      return "Present";
    case "absent":
      return "Absent";
    case "late":
      return "Late";
    case "informed":
      return "Informed";
    case "excused":
      return "Excused";
    case "half_day":
    case "halfday":
    case "half day":
      return "Half Day";
    default:
      return (status.charAt(0).toUpperCase() + status.slice(1)) as AttendanceStatus;
  }
};

// GET /api/attendance?className=Class 8&section=B&date=2026-08-27&studentId=...
export async function getAttendanceByClassDate(req: Request, res: Response) {
  try {
    const { className, section, date, studentId, subject } = req.query;
    const filter: any = {};
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (date) filter.date = normalizeDateString(date as string);
    if (studentId) filter.studentId = studentId;
    if (subject) filter.subject = subject;

    const records = await Attendance.find(filter).sort({ date: -1, studentName: 1 });
    return res.status(200).json({ success: true, data: records, count: records.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch attendance" });
  }
}

// POST /api/attendance/bulk
// Accepts either:
// { className, section, date, entries: [{ studentId, studentName, status }] }
// OR { className, section, date, subject, markedBy, records: [{ studentId, studentName, status }] }
export async function bulkMarkAttendance(req: Request, res: Response) {
  try {
    const { className, section, date, subject = "General", markedBy, academicYear, term } = req.body;
    const items = req.body.entries || req.body.records;

    if (!className || !section || !date || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload: className, section, date, and entries/records array are required",
      });
    }

    const dateStr = normalizeDateString(date);

    const ops = items.map((entry: any) => ({
      updateOne: {
        filter: { studentId: entry.studentId, date: dateStr },
        update: {
          $set: {
            studentId: entry.studentId,
            studentName: entry.studentName,
            className,
            section,
            date: dateStr,
            status: normalizeStatus(entry.status),
            subject: entry.subject || subject,
            markedBy: entry.markedBy || markedBy,
            academicYear: entry.academicYear || academicYear,
            term: entry.term || term,
            remarks: entry.remarks,
          },
        },
        upsert: true,
      },
    }));

    if (ops.length > 0) {
      await Attendance.bulkWrite(ops);
    }
    return res.status(200).json({
      success: true,
      message: `Attendance saved for ${ops.length} students`,
      count: ops.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Failed to save attendance" });
  }
}

// Alias for backwards compatibility
export const markBulkAttendance = bulkMarkAttendance;

// POST /api/attendance/mark or POST /api/attendance
export const markAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      studentId,
      studentName,
      rollNumber,
      className,
      section,
      date,
      status,
      subject = "General",
      markedBy,
      remarks,
      academicYear,
      term,
    } = req.body;

    if (!studentId || !studentName || !className || !status) {
      res.status(400).json({
        success: false,
        message: "studentId, studentName, className, and status are required fields.",
      });
      return;
    }

    const dateStr = normalizeDateString(date);
    const validStatus = normalizeStatus(status);

    const updatedRecord = await Attendance.findOneAndUpdate(
      { studentId, date: dateStr },
      {
        studentName,
        rollNumber,
        className,
        section,
        date: dateStr,
        status: validStatus,
        subject,
        markedBy,
        remarks,
        academicYear,
        term,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Attendance marked as '${validStatus}' successfully.`,
      data: updatedRecord,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/all with query filters and pagination
export const getAllAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      className,
      section,
      studentId,
      date,
      startDate,
      endDate,
      status,
      subject,
      academicYear,
      page = "1",
      limit = "50",
    } = req.query;

    const filter: Record<string, any> = {};

    if (className) {
      filter.className = { $regex: new RegExp(`^${className}$`, "i") };
    }
    if (section) {
      filter.section = { $regex: new RegExp(`^${section}$`, "i") };
    }
    if (studentId) {
      filter.studentId = studentId;
    }
    if (status) {
      filter.status = normalizeStatus(status as string);
    }
    if (subject) {
      filter.subject = { $regex: new RegExp(`^${subject}$`, "i") };
    }
    if (academicYear) {
      filter.academicYear = academicYear;
    }

    if (date) {
      filter.date = normalizeDateString(date as string);
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = normalizeDateString(startDate as string);
      }
      if (endDate) {
        filter.date.$lte = normalizeDateString(endDate as string);
      }
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1, studentName: 1 }).skip(skip).limit(limitNum),
      Attendance.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/:id
export const getAttendanceById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid attendance record ID format." });
      return;
    }

    const record = await Attendance.findById(id);
    if (!record) {
      res.status(404).json({ success: false, message: "Attendance record not found." });
      return;
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/attendance/:id
export const updateAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status, remarks, rollNumber, markedBy } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid attendance record ID format." });
      return;
    }

    const updateFields: Record<string, any> = {};
    if (status) updateFields.status = normalizeStatus(status);
    if (remarks !== undefined) updateFields.remarks = remarks;
    if (rollNumber !== undefined) updateFields.rollNumber = rollNumber;
    if (markedBy !== undefined) updateFields.markedBy = markedBy;

    const updatedRecord = await Attendance.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedRecord) {
      res.status(404).json({ success: false, message: "Attendance record not found." });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully.",
      data: updatedRecord,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/attendance/:id
export const deleteAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid attendance record ID format." });
      return;
    }

    const deletedRecord = await Attendance.findByIdAndDelete(id);
    if (!deletedRecord) {
      res.status(404).json({ success: false, message: "Attendance record not found." });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully.",
      data: deletedRecord,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/summary/student/:studentId
export const getStudentAttendanceSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, academicYear } = req.query;

    if (!studentId) {
      res.status(400).json({ success: false, message: "studentId param is required." });
      return;
    }

    const filter: Record<string, any> = { studentId };

    if (academicYear) filter.academicYear = academicYear;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = normalizeDateString(startDate as string);
      if (endDate) filter.date.$lte = normalizeDateString(endDate as string);
    }

    const records = await Attendance.find(filter).sort({ date: 1 });

    if (records.length === 0) {
      res.status(200).json({
        success: true,
        studentId,
        message: "No attendance records found for this student.",
        summary: {
          totalDays: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          informedCount: 0,
          excusedCount: 0,
          halfDayCount: 0,
          attendancePercentage: 0,
        },
        monthlyBreakdown: {},
        records: [],
      });
      return;
    }

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let informedCount = 0;
    let excusedCount = 0;
    let halfDayCount = 0;

    const monthlyBreakdown: Record<
      string,
      {
        total: number;
        present: number;
        absent: number;
        late: number;
        informed: number;
        excused: number;
        halfDay: number;
        percentage: number;
      }
    > = {};

    for (const record of records) {
      switch (record.status) {
        case "Present":
          presentCount++;
          break;
        case "Absent":
          absentCount++;
          break;
        case "Late":
          lateCount++;
          break;
        case "Informed":
          informedCount++;
          break;
        case "Excused":
          excusedCount++;
          break;
        case "Half Day":
          halfDayCount++;
          break;
      }

      const monthKey = record.date.slice(0, 7);
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          informed: 0,
          excused: 0,
          halfDay: 0,
          percentage: 0,
        };
      }

      const m = monthlyBreakdown[monthKey]!;
      m.total++;
      if (record.status === "Present") m.present++;
      else if (record.status === "Absent") m.absent++;
      else if (record.status === "Late") m.late++;
      else if (record.status === "Informed") m.informed++;
      else if (record.status === "Excused") m.excused++;
      else if (record.status === "Half Day") m.halfDay++;
    }

    const totalDays = records.length;
    const effectivePresent = presentCount + lateCount + halfDayCount * 0.5;
    const overallPercentage =
      totalDays > 0 ? Number(((effectivePresent / totalDays) * 100).toFixed(2)) : 0;

    for (const key of Object.keys(monthlyBreakdown)) {
      const mb = monthlyBreakdown[key]!;
      const eff = mb.present + mb.late + mb.halfDay * 0.5;
      mb.percentage = mb.total > 0 ? Number(((eff / mb.total) * 100).toFixed(2)) : 0;
    }

    res.status(200).json({
      success: true,
      student: {
        studentId: records[0]?.studentId,
        studentName: records[0]?.studentName,
        rollNumber: records[0]?.rollNumber,
        className: records[0]?.className,
        section: records[0]?.section,
      },
      summary: {
        totalDays,
        presentCount,
        absentCount,
        lateCount,
        informedCount,
        excusedCount,
        halfDayCount,
        attendancePercentage: overallPercentage,
      },
      monthlyBreakdown,
      records,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/summary/class
export const getClassAttendanceSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { className, section, date, subject = "General" } = req.query;

    if (!className) {
      res.status(400).json({ success: false, message: "className query parameter is required." });
      return;
    }

    const dateStr = normalizeDateString(date as string | undefined);

    const filter: Record<string, any> = {
      className: { $regex: new RegExp(`^${className}$`, "i") },
      date: dateStr,
    };

    if (section) {
      filter.section = { $regex: new RegExp(`^${section}$`, "i") };
    }
    if (subject) {
      filter.subject = { $regex: new RegExp(`^${subject}$`, "i") };
    }

    const records = await Attendance.find(filter).sort({ rollNumber: 1, studentName: 1 });

    const totalStudents = records.length;
    const presentStudents: any[] = [];
    const absentStudents: any[] = [];
    const lateStudents: any[] = [];
    const informedStudents: any[] = [];
    const excusedStudents: any[] = [];
    const halfDayStudents: any[] = [];

    for (const r of records) {
      const info = {
        studentId: r.studentId,
        studentName: r.studentName,
        rollNumber: r.rollNumber,
        remarks: r.remarks,
      };

      if (r.status === "Present") presentStudents.push(info);
      else if (r.status === "Absent") absentStudents.push(info);
      else if (r.status === "Late") lateStudents.push(info);
      else if (r.status === "Informed") informedStudents.push(info);
      else if (r.status === "Excused") excusedStudents.push(info);
      else if (r.status === "Half Day") halfDayStudents.push(info);
    }

    const presentPercentage =
      totalStudents > 0
        ? Number(
            (
              ((presentStudents.length + lateStudents.length + halfDayStudents.length * 0.5) /
                totalStudents) *
              100
            ).toFixed(2)
          )
        : 0;

    res.status(200).json({
      success: true,
      classInfo: {
        className,
        section: section || "All",
        date: dateStr,
        subject,
      },
      summary: {
        totalStudents,
        presentCount: presentStudents.length,
        absentCount: absentStudents.length,
        lateCount: lateStudents.length,
        informedCount: informedStudents.length,
        excusedCount: excusedStudents.length,
        halfDayCount: halfDayStudents.length,
        presentPercentage,
      },
      absentStudents,
      lateStudents,
      informedStudents,
      excusedStudents,
      allRecords: records,
    });
  } catch (error) {
    next(error);
  }
};
