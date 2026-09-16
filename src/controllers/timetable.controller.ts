import { Request, Response, NextFunction } from "express";
import { TimetableSlot, DayOfWeek } from "../models/TimetableSlot";
import mongoose from "mongoose";

const DAYS_ORDER: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const timeToMinutes = (timeStr: string): number => {
  const parts = timeStr.split(":").map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  return hours * 60 + minutes;
};

// Helper: Group slots by Day of Week
const groupSlotsByDay = (slots: any[]) => {
  const grouped: Record<string, any[]> = {};
  for (const day of DAYS_ORDER) {
    grouped[day] = [];
  }

  for (const slot of slots) {
    if (grouped[slot.dayOfWeek]) {
      grouped[slot.dayOfWeek]!.push(slot);
    } else {
      grouped[slot.dayOfWeek] = [slot];
    }
  }

  // Sort each day's slots by startTime
  for (const day of Object.keys(grouped)) {
    grouped[day]?.sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
  }

  return grouped;
};

// Create Single Timetable Slot
export const createSlot = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      dayOfWeek,
      day,
      courseCode,
      courseName,
      subject,
      teacherName,
      teacher,
      teacherId,
      className,
      grade,
      section,
      classCode,
      startTime,
      endTime,
      room,
      color,
      academicYear,
      semester,
    } = req.body;

    const effDay = (dayOfWeek || day) as DayOfWeek;
    const effCourseName = (courseName || subject || "").trim();
    const effTeacher = (teacherName || teacher || "").trim();
    const effClass = (className || grade || "").trim();
    const effCourseCode = (courseCode || (effCourseName ? `${effCourseName.slice(0, 3).toUpperCase()}101` : "SUB101")).trim();

    if (
      !effDay ||
      !effCourseCode ||
      !effCourseName ||
      !effTeacher ||
      !startTime ||
      !endTime ||
      !room
    ) {
      res.status(400).json({
        success: false,
        message:
          "dayOfWeek/day, courseName/subject, teacherName/teacher, startTime, endTime, and room are required fields.",
      });
      return;
    }

    if (!DAYS_ORDER.includes(effDay)) {
      res.status(400).json({
        success: false,
        message: `Invalid dayOfWeek. Must be one of: ${DAYS_ORDER.join(", ")}`,
      });
      return;
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      res.status(400).json({
        success: false,
        message: "Start time must be before end time.",
      });
      return;
    }

    // Auto-generate classCode if className and section are provided
    const computedClassCode =
      classCode || (effClass && section ? `${effClass}-${section}` : effClass);

    const slot = new TimetableSlot({
      dayOfWeek: effDay,
      courseCode: effCourseCode,
      courseName: effCourseName,
      teacherName: effTeacher,
      teacherId,
      className: effClass,
      section: section || "A",
      classCode: computedClassCode,
      startTime,
      endTime,
      room,
      color,
      academicYear,
      semester,
    });

    await slot.save();

    const formattedSlot = {
      ...(slot.toObject ? slot.toObject() : slot),
      id: slot._id,
      day: slot.dayOfWeek,
      subject: slot.courseName,
      teacher: slot.teacherName,
      grade: slot.className,
    };

    res.status(201).json({
      success: true,
      message: "Timetable slot created successfully.",
      data: formattedSlot,
    });
  } catch (error) {
    next(error);
  }
};

// Bulk Create Timetable Slots
export const createBulkSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slots } = req.body;

    if (!Array.isArray(slots) || slots.length === 0) {
      res.status(400).json({
        success: false,
        message: "slots array is required and must not be empty.",
      });
      return;
    }

    const validatedSlots = [];
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const effDay = (s.dayOfWeek || s.day) as DayOfWeek;
      const effCourseName = (s.courseName || s.subject || "").trim();
      const effTeacher = (s.teacherName || s.teacher || "").trim();
      const effClass = (s.className || s.grade || "").trim();
      const effCourseCode = (s.courseCode || (effCourseName ? `${effCourseName.slice(0, 3).toUpperCase()}101` : "SUB101")).trim();

      if (
        !effDay ||
        !effCourseCode ||
        !effCourseName ||
        !effTeacher ||
        !s.startTime ||
        !s.endTime ||
        !s.room
      ) {
        res.status(400).json({
          success: false,
          message: `Slot at index ${i} is missing required fields.`,
        });
        return;
      }

      const startMinutes = timeToMinutes(s.startTime);
      const endMinutes = timeToMinutes(s.endTime);
      if (startMinutes >= endMinutes) {
        res.status(400).json({
          success: false,
          message: `Slot at index ${i} has start time after or equal to end time.`,
        });
        return;
      }

      const computedClassCode =
        s.classCode ||
        (effClass && s.section ? `${effClass}-${s.section}` : effClass);

      validatedSlots.push({
        dayOfWeek: effDay,
        courseCode: effCourseCode,
        courseName: effCourseName,
        teacherName: effTeacher,
        teacherId: s.teacherId,
        className: effClass,
        section: s.section || "A",
        classCode: computedClassCode,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
        color: s.color,
        academicYear: s.academicYear,
        semester: s.semester,
      });
    }

    const createdSlots = await TimetableSlot.insertMany(validatedSlots);

    const formattedSlots = createdSlots.map((slot: any) => ({
      ...(slot.toObject ? slot.toObject() : slot),
      id: slot._id,
      day: slot.dayOfWeek,
      subject: slot.courseName,
      teacher: slot.teacherName,
      grade: slot.className,
    }));

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdSlots.length} timetable slots.`,
      data: formattedSlots,
    });
  } catch (error) {
    next(error);
  }
};

// Get All Timetable Slots (with filtering)
export const getAllSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      dayOfWeek,
      day,
      className,
      grade,
      section,
      classCode,
      teacherName,
      teacher,
      teacherId,
      room,
      courseCode,
      academicYear,
      semester,
    } = req.query;

    const filter: Record<string, any> = { isActive: true };

    const effDay = dayOfWeek || day;
    const effClass = className || grade;
    const effTeacher = teacherName || teacher;

    if (effDay) {
      filter.dayOfWeek = effDay;
    }
    if (effClass) {
      filter.className = { $regex: new RegExp(`^${effClass}$`, "i") };
    }
    if (section) {
      filter.section = { $regex: new RegExp(`^${section}$`, "i") };
    }
    if (classCode) {
      filter.classCode = { $regex: new RegExp(`^${classCode}$`, "i") };
    }
    if (effTeacher) {
      filter.teacherName = { $regex: effTeacher as string, $options: "i" };
    }
    if (teacherId) {
      filter.teacherId = teacherId;
    }
    if (room) {
      filter.room = { $regex: new RegExp(`^${room}$`, "i") };
    }
    if (courseCode) {
      filter.courseCode = { $regex: new RegExp(`^${courseCode}$`, "i") };
    }
    if (academicYear) {
      filter.academicYear = academicYear;
    }
    if (semester) {
      filter.semester = semester;
    }

    const slots = await TimetableSlot.find(filter).sort({
      dayOfWeek: 1,
      startTime: 1,
    });

    const formattedSlots = slots.map((slot: any) => ({
      ...(slot.toObject ? slot.toObject() : slot),
      id: slot._id,
      day: slot.dayOfWeek,
      subject: slot.courseName,
      teacher: slot.teacherName,
      grade: slot.className,
    }));

    res.status(200).json({
      success: true,
      count: formattedSlots.length,
      data: formattedSlots,
    });
  } catch (error) {
    next(error);
  }
};

// Get Routine Grouped by Class and Section
export const getRoutineByClass = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { className, section, classCode } = req.query;

    if (!className && !classCode) {
      res.status(400).json({
        success: false,
        message: "className or classCode query parameter is required.",
      });
      return;
    }

    const filter: Record<string, any> = { isActive: true };

    if (classCode) {
      filter.classCode = { $regex: new RegExp(`^${classCode}$`, "i") };
    } else {
      if (className) {
        filter.className = { $regex: new RegExp(`^${className}$`, "i") };
      }
      if (section) {
        filter.section = { $regex: new RegExp(`^${section}$`, "i") };
      }
    }

    const slots = await TimetableSlot.find(filter);
    const routine = groupSlotsByDay(slots);

    res.status(200).json({
      success: true,
      classInfo: {
        className: className || null,
        section: section || null,
        classCode: classCode || null,
      },
      totalSlots: slots.length,
      routine,
    });
  } catch (error) {
    next(error);
  }
};

// Get Routine for a Teacher
export const getRoutineByTeacher = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teacherName, teacherId } = req.query;

    if (!teacherName && !teacherId) {
      res.status(400).json({
        success: false,
        message: "teacherName or teacherId query parameter is required.",
      });
      return;
    }

    const filter: Record<string, any> = { isActive: true };

    if (teacherId) {
      filter.teacherId = teacherId;
    }
    if (teacherName) {
      filter.teacherName = { $regex: teacherName, $options: "i" };
    }

    const slots = await TimetableSlot.find(filter);
    const routine = groupSlotsByDay(slots);

    res.status(200).json({
      success: true,
      teacherInfo: {
        teacherName: teacherName || null,
        teacherId: teacherId || null,
      },
      totalSlots: slots.length,
      routine,
    });
  } catch (error) {
    next(error);
  }
};

// Get Routine for a Student (Based on class & section)
export const getRoutineByStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { className, section, classCode } = req.query;

    if (!className && !classCode) {
      res.status(400).json({
        success: false,
        message:
          "Student routine requires className (and optional section) or classCode.",
      });
      return;
    }

    const filter: Record<string, any> = { isActive: true };

    if (classCode) {
      filter.classCode = { $regex: new RegExp(`^${classCode}$`, "i") };
    } else {
      if (className) {
        filter.className = { $regex: new RegExp(`^${className}$`, "i") };
      }
      if (section) {
        filter.section = { $regex: new RegExp(`^${section}$`, "i") };
      }
    }

    const slots = await TimetableSlot.find(filter);
    const routine = groupSlotsByDay(slots);

    res.status(200).json({
      success: true,
      studentInfo: {
        className: className || null,
        section: section || null,
        classCode: classCode || null,
      },
      totalSlots: slots.length,
      routine,
    });
  } catch (error) {
    next(error);
  }
};

// Check for Scheduling Conflict
export const checkConflict = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dayOfWeek, startTime, endTime, room, teacherName, excludeId } =
      req.body;

    if (!dayOfWeek || !startTime || !endTime) {
      res.status(400).json({
        success: false,
        message: "dayOfWeek, startTime, and endTime are required.",
      });
      return;
    }

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    if (newStart >= newEnd) {
      res.status(400).json({
        success: false,
        message: "startTime must be before endTime.",
      });
      return;
    }

    const filter: Record<string, any> = {
      dayOfWeek,
      isActive: true,
    };

    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: excludeId };
    }

    // Check potential conflicts on the same day
    const existingSlots = await TimetableSlot.find(filter);

    const conflicts: {
      type: "room" | "teacher";
      slot: any;
      reason: string;
    }[] = [];

    for (const slot of existingSlots) {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);

      // Overlap condition: (StartA < EndB) and (EndA > StartB)
      const isOverlapping = newStart < slotEnd && newEnd > slotStart;

      if (isOverlapping) {
        if (room && slot.room.toLowerCase() === room.toLowerCase()) {
          conflicts.push({
            type: "room",
            slot,
            reason: `Room ${room} is already booked for ${slot.courseName} (${slot.startTime} - ${slot.endTime})`,
          });
        }
        if (
          teacherName &&
          slot.teacherName.toLowerCase() === teacherName.toLowerCase()
        ) {
          conflicts.push({
            type: "teacher",
            slot,
            reason: `Teacher ${teacherName} is already scheduled for ${slot.courseName} in ${slot.room} (${slot.startTime} - ${slot.endTime})`,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      hasConflict: conflicts.length > 0,
      conflicts,
    });
  } catch (error) {
    next(error);
  }
};

// Get Timetable Slot by ID
export const getSlotById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid slot ID format." });
      return;
    }

    const slot = await TimetableSlot.findById(id);
    if (!slot) {
      res
        .status(404)
        .json({ success: false, message: "Timetable slot not found." });
      return;
    }

    res.status(200).json({ success: true, data: slot });
  } catch (error) {
    next(error);
  }
};

// Update Timetable Slot
export const updateSlot = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const {
      dayOfWeek,
      day,
      courseCode,
      courseName,
      subject,
      teacherName,
      teacher,
      teacherId,
      className,
      grade,
      section,
      classCode,
      startTime,
      endTime,
      room,
      color,
      academicYear,
      semester,
      isActive,
    } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid slot ID format." });
      return;
    }

    const slot = await TimetableSlot.findById(id);
    if (!slot) {
      res
        .status(404)
        .json({ success: false, message: "Timetable slot not found." });
      return;
    }

    const updatedStartTime = startTime !== undefined ? startTime : slot.startTime;
    const updatedEndTime = endTime !== undefined ? endTime : slot.endTime;

    const startMinutes = timeToMinutes(updatedStartTime);
    const endMinutes = timeToMinutes(updatedEndTime);

    if (startMinutes >= endMinutes) {
      res.status(400).json({
        success: false,
        message: "Start time must be before end time.",
      });
      return;
    }

    const effClass = className !== undefined ? className : grade !== undefined ? grade : slot.className;
    const effCourseName = courseName !== undefined ? courseName : subject !== undefined ? subject : slot.courseName;
    const effTeacher = teacherName !== undefined ? teacherName : teacher !== undefined ? teacher : slot.teacherName;
    const effDay = dayOfWeek !== undefined ? dayOfWeek : day !== undefined ? day : slot.dayOfWeek;

    const updatedClassCode =
      classCode !== undefined
        ? classCode
        : effClass && section
        ? `${effClass}-${section}`
        : slot.classCode;

    const updatedSlot = await TimetableSlot.findByIdAndUpdate(
      id,
      {
        dayOfWeek: effDay,
        courseCode: courseCode !== undefined ? courseCode : slot.courseCode,
        courseName: effCourseName,
        teacherName: effTeacher,
        teacherId: teacherId !== undefined ? teacherId : slot.teacherId,
        className: effClass,
        section: section !== undefined ? section : slot.section,
        classCode: updatedClassCode,
        startTime: updatedStartTime,
        endTime: updatedEndTime,
        room: room !== undefined ? room : slot.room,
        color: color !== undefined ? color : slot.color,
        academicYear:
          academicYear !== undefined ? academicYear : slot.academicYear,
        semester: semester !== undefined ? semester : slot.semester,
        isActive: isActive !== undefined ? isActive : slot.isActive,
      },
      { returnDocument: "after", runValidators: true }
    );

    const formattedSlot = updatedSlot
      ? {
          ...(updatedSlot.toObject ? updatedSlot.toObject() : updatedSlot),
          id: updatedSlot._id,
          day: updatedSlot.dayOfWeek,
          subject: updatedSlot.courseName,
          teacher: updatedSlot.teacherName,
          grade: updatedSlot.className,
        }
      : updatedSlot;

    res.status(200).json({
      success: true,
      message: "Timetable slot updated successfully.",
      data: formattedSlot,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Timetable Slot
export const deleteSlot = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid slot ID format." });
      return;
    }

    const slot = await TimetableSlot.findByIdAndDelete(id);
    if (!slot) {
      res
        .status(404)
        .json({ success: false, message: "Timetable slot not found." });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Timetable slot deleted successfully.",
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};
