import { Request, Response, NextFunction } from "express";
import { Attendance, AttendanceStatus, IAttendance } from "../models/Attendance";
import mongoose from "mongoose";

// Helper to normalize Date and dateString
const normalizeDate = (
  dateInput?: string | Date
): { date: Date; dateString: string } => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    throw new Error("Invalid date format provided.");
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;
  const normalizedDate = new Date(`${dateString}T00:00:00.000Z`);
  return { date: normalizedDate, dateString };
};

// Mark / Upsert Single Student Attendance
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

    if (!studentId || !studentName || !className || !status || !markedBy) {
      res.status(400).json({
        success: false,
        message:
          "studentId, studentName, className, status, and markedBy are required fields.",
      });
      return;
    }

    const validStatuses: AttendanceStatus[] = [
      "present",
      "absent",
      "late",
      "excused",
      "half_day",
    ];
    if (!validStatuses.includes(status as AttendanceStatus)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
      return;
    }

    const { date: normalizedDate, dateString } = normalizeDate(date);

    // Upsert record: if attendance exists for student on date for subject, update it
    const updatedRecord = await Attendance.findOneAndUpdate(
      { studentId, dateString, subject },
      {
        studentName,
        rollNumber,
        className,
        section,
        date: normalizedDate,
        dateString,
        status,
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
      message: `Attendance marked as '${status}' successfully.`,
      data: updatedRecord,
    });
  } catch (error) {
    next(error);
  }
};

// Mark Bulk Attendance (For Entire Class / Section)
export const markBulkAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      className,
      section,
      date,
      subject = "General",
      markedBy,
      academicYear,
      term,
      records,
    } = req.body;

    if (!className || !markedBy || !Array.isArray(records) || records.length === 0) {
      res.status(400).json({
        success: false,
        message:
          "className, markedBy, and a non-empty 'records' array are required.",
      });
      return;
    }

    const { date: normalizedDate, dateString } = normalizeDate(date);

    const validStatuses: AttendanceStatus[] = [
      "present",
      "absent",
      "late",
      "excused",
      "half_day",
    ];

    const bulkOps = records.map((record: any, index: number) => {
      const {
        studentId,
        studentName,
        rollNumber,
        status = "present",
        remarks,
        studentSection = section,
      } = record;

      if (!studentId || !studentName) {
        throw new Error(
          `Record at index ${index} must include studentId and studentName.`
        );
      }

      if (!validStatuses.includes(status as AttendanceStatus)) {
        throw new Error(
          `Record at index ${index} has invalid status '${status}'. Must be one of: ${validStatuses.join(", ")}`
        );
      }

      return {
        updateOne: {
          filter: { studentId, dateString, subject },
          update: {
            $set: {
              studentName,
              rollNumber,
              className,
              section: studentSection,
              date: normalizedDate,
              dateString,
              status,
              subject,
              markedBy,
              remarks,
              academicYear,
              term,
            },
          },
          upsert: true,
        },
      };
    });

    const result = await Attendance.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: `Successfully processed attendance for ${records.length} students.`,
      result: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get All Attendance Records (with rich filters)
export const getAllAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      date,
      startDate,
      endDate,
      className,
      section,
      studentId,
      status,
      subject,
      markedBy,
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
      filter.status = status;
    }
    if (subject) {
      filter.subject = { $regex: new RegExp(`^${subject}$`, "i") };
    }
    if (markedBy) {
      filter.markedBy = { $regex: markedBy as string, $options: "i" };
    }

    // Date filtering
    if (date) {
      const { dateString } = normalizeDate(date as string);
      filter.dateString = dateString;
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const { date: start } = normalizeDate(startDate as string);
        filter.date.$gte = start;
      }
      if (endDate) {
        const { date: end } = normalizeDate(endDate as string);
        filter.date.$lte = end;
      }
    }

    const records = await Attendance.find(filter).sort({
      date: -1,
      rollNumber: 1,
      studentName: 1,
    });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// Get Attendance Record by ID
export const getAttendanceById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid attendance ID format." });
      return;
    }

    const record = await Attendance.findById(id);
    if (!record) {
      res
        .status(404)
        .json({ success: false, message: "Attendance record not found." });
      return;
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// Update Attendance Record
export const updateAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, remarks, markedBy, rollNumber, studentName } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid attendance ID format." });
      return;
    }

    const validStatuses: AttendanceStatus[] = [
      "present",
      "absent",
      "late",
      "excused",
      "half_day",
    ];
    if (status && !validStatuses.includes(status as AttendanceStatus)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
      return;
    }

    const record = await Attendance.findById(id);
    if (!record) {
      res
        .status(404)
        .json({ success: false, message: "Attendance record not found." });
      return;
    }

    const updatedRecord = await Attendance.findByIdAndUpdate(
      id,
      {
        status: status !== undefined ? status : record.status,
        remarks: remarks !== undefined ? remarks : record.remarks,
        markedBy: markedBy !== undefined ? markedBy : record.markedBy,
        rollNumber: rollNumber !== undefined ? rollNumber : record.rollNumber,
        studentName: studentName !== undefined ? studentName : record.studentName,
      },
      { returnDocument: "after", runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Attendance record updated successfully.",
      data: updatedRecord,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Attendance Record
export const deleteAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid attendance ID format." });
      return;
    }

    const record = await Attendance.findByIdAndDelete(id);
    if (!record) {
      res
        .status(404)
        .json({ success: false, message: "Attendance record not found." });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully.",
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// Student / Parent Attendance View & Summary
export const getStudentAttendanceSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const { startDate, endDate, subject, academicYear } = req.query;

    if (!studentId) {
      res.status(400).json({
        success: false,
        message: "studentId parameter is required.",
      });
      return;
    }

    const filter: Record<string, any> = { studentId };

    if (subject) {
      filter.subject = { $regex: new RegExp(`^${subject}$`, "i") };
    }
    if (academicYear) {
      filter.academicYear = academicYear;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const { date: start } = normalizeDate(startDate as string);
        filter.date.$gte = start;
      }
      if (endDate) {
        const { date: end } = normalizeDate(endDate as string);
        filter.date.$lte = end;
      }
    }

    const records = await Attendance.find(filter).sort({ date: -1 });

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
          excusedCount: 0,
          halfDayCount: 0,
          attendancePercentage: 0,
        },
        monthlyBreakdown: {},
        records: [],
      });
      return;
    }

    const studentInfo = {
      studentId: records[0]?.studentId,
      studentName: records[0]?.studentName,
      rollNumber: records[0]?.rollNumber,
      className: records[0]?.className,
      section: records[0]?.section,
    };

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let halfDayCount = 0;

    const monthlyBreakdown: Record<
      string,
      {
        total: number;
        present: number;
        absent: number;
        late: number;
        excused: number;
        halfDay: number;
        percentage: number;
      }
    > = {};

    for (const record of records) {
      switch (record.status) {
        case "present":
          presentCount++;
          break;
        case "absent":
          absentCount++;
          break;
        case "late":
          lateCount++;
          break;
        case "excused":
          excusedCount++;
          break;
        case "half_day":
          halfDayCount++;
          break;
      }

      // Month key YYYY-MM
      const monthKey = record.dateString.slice(0, 7);
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          halfDay: 0,
          percentage: 0,
        };
      }

      const m = monthlyBreakdown[monthKey]!;
      m.total++;
      if (record.status === "present") m.present++;
      else if (record.status === "absent") m.absent++;
      else if (record.status === "late") m.late++;
      else if (record.status === "excused") m.excused++;
      else if (record.status === "half_day") m.halfDay++;
    }

    // Calculate percentages
    const totalDays = records.length;
    // Effective present score: present + late + (half_day * 0.5)
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
      student: studentInfo,
      summary: {
        totalDays,
        presentCount,
        absentCount,
        lateCount,
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

// Class Attendance Summary (Daily or Range for Teachers/Admins)
export const getClassAttendanceSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { className, section, date, subject = "General" } = req.query;

    if (!className) {
      res.status(400).json({
        success: false,
        message: "className query parameter is required.",
      });
      return;
    }

    const { dateString } = normalizeDate(date as string | undefined);

    const filter: Record<string, any> = {
      className: { $regex: new RegExp(`^${className}$`, "i") },
      dateString,
    };

    if (section) {
      filter.section = { $regex: new RegExp(`^${section}$`, "i") };
    }
    if (subject) {
      filter.subject = { $regex: new RegExp(`^${subject}$`, "i") };
    }

    const records = await Attendance.find(filter).sort({
      rollNumber: 1,
      studentName: 1,
    });

    const totalStudents = records.length;
    const presentStudents: any[] = [];
    const absentStudents: any[] = [];
    const lateStudents: any[] = [];
    const excusedStudents: any[] = [];
    const halfDayStudents: any[] = [];

    for (const r of records) {
      const info = {
        studentId: r.studentId,
        studentName: r.studentName,
        rollNumber: r.rollNumber,
        remarks: r.remarks,
      };

      if (r.status === "present") presentStudents.push(info);
      else if (r.status === "absent") absentStudents.push(info);
      else if (r.status === "late") lateStudents.push(info);
      else if (r.status === "excused") excusedStudents.push(info);
      else if (r.status === "half_day") halfDayStudents.push(info);
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
        dateString,
        subject,
      },
      summary: {
        totalStudents,
        presentCount: presentStudents.length,
        absentCount: absentStudents.length,
        lateCount: lateStudents.length,
        excusedCount: excusedStudents.length,
        halfDayCount: halfDayStudents.length,
        presentPercentage,
      },
      absentStudents,
      lateStudents,
      excusedStudents,
      allRecords: records,
    });
  } catch (error) {
    next(error);
  }
};
