import { Request, Response, NextFunction } from "express";
import { Event } from "../models/Event";
import mongoose from "mongoose";

// Helper to compute startDate and endDate
const computeEventDates = (date?: string, startTime?: string, endTime?: string, startDate?: any, endDate?: any) => {
  let start: Date;
  let end: Date;

  if (startDate) {
    start = new Date(startDate);
  } else if (date && startTime) {
    const parsed = new Date(`${date}T${startTime}:00`);
    start = isNaN(parsed.getTime()) ? new Date(date) : parsed;
  } else if (date) {
    start = new Date(date);
  } else {
    start = new Date();
  }

  if (endDate) {
    end = new Date(endDate);
  } else if (date && endTime) {
    const parsed = new Date(`${date}T${endTime}:00`);
    end = isNaN(parsed.getTime()) ? new Date(start.getTime() + 60 * 60 * 1000) : parsed;
  } else {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }

  return { start, end };
};

// Create Event
export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      id,
      customId,
      title,
      description,
      date,
      startTime,
      endTime,
      startDate,
      endDate,
      category,
      calendarId,
      targetRoles,
      location,
      color,
      courseCode,
      isAllDay,
      createdBy,
    } = req.body;

    if (!title) {
      res.status(400).json({
        success: false,
        message: "Title is a required field.",
      });
      return;
    }

    const { start, end } = computeEventDates(date, startTime, endTime, startDate, endDate);

    const eventDate = date || start.toISOString().split("T")[0];
    const eventStartTime = startTime || `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
    const eventEndTime = endTime || `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;

    const event = new Event({
      customId: customId || id,
      title,
      description: description || "",
      date: eventDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      startDate: start,
      endDate: end,
      category: category || "event",
      calendarId: calendarId || "cal-academic",
      targetRoles: Array.isArray(targetRoles) && targetRoles.length > 0
        ? targetRoles
        : ["admin", "teacher", "student", "parent"],
      location: location || "",
      color,
      courseCode,
      isAllDay: !!isAllDay,
      createdBy,
    });

    await event.save();
    res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// Bulk Create Events (useful for initial seeding)
export const createBulkEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({
        success: false,
        message: "events array is required and must not be empty.",
      });
      return;
    }

    const validatedEvents = events.map((e: any) => {
      const { start, end } = computeEventDates(e.date, e.startTime, e.endTime, e.startDate, e.endDate);
      const eventDate = e.date || start.toISOString().split("T")[0];
      const eventStartTime = e.startTime || "09:00";
      const eventEndTime = e.endTime || "10:00";

      return {
        customId: e.id || e.customId,
        title: e.title,
        description: e.description || "",
        date: eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime,
        startDate: start,
        endDate: end,
        category: e.category || "event",
        calendarId: e.calendarId || "cal-academic",
        targetRoles: Array.isArray(e.targetRoles) && e.targetRoles.length > 0
          ? e.targetRoles
          : ["admin", "teacher", "student", "parent"],
        location: e.location || "",
        color: e.color,
        courseCode: e.courseCode,
        isAllDay: !!e.isAllDay,
        createdBy: e.createdBy,
      };
    });

    const createdEvents = await Event.insertMany(validatedEvents);
    res.status(201).json({
      success: true,
      message: `Successfully created ${createdEvents.length} events.`,
      data: createdEvents,
    });
  } catch (error) {
    next(error);
  }
};

// Get All Events (with filtering)
export const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, date, category, calendarId, role, courseCode } = req.query;
    const filter: Record<string, any> = {};

    if (category) {
      filter.category = category;
    }

    if (calendarId) {
      filter.calendarId = calendarId;
    }

    if (date) {
      filter.date = date;
    }

    if (role) {
      filter.targetRoles = role;
    }

    if (courseCode) {
      filter.courseCode = courseCode;
    }

    // Handle date range filtering
    if (startDate || endDate) {
      filter.$and = [];

      if (startDate) {
        const start = new Date(startDate as string);
        if (!isNaN(start.getTime())) {
          filter.$and.push({ endDate: { $gte: start } });
        }
      }

      if (endDate) {
        const end = new Date(endDate as string);
        if (!isNaN(end.getTime())) {
          filter.$and.push({ startDate: { $lte: end } });
        }
      }
    }

    const events = await Event.find(filter).sort({ date: 1, startTime: 1, startDate: 1 });
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    next(error);
  }
};

// Helper to find an event by Mongo _id or customId
const findEventByIdOrCustomId = async (id: string) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byId = await Event.findById(id);
    if (byId) return byId;
  }
  return await Event.findOne({ customId: id });
};

// Get Event By ID
export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Event ID is required.",
      });
      return;
    }

    const event = await findEventByIdOrCustomId(id);
    if (!event) {
      res.status(404).json({
        success: false,
        message: "Event not found.",
      });
      return;
    }

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// Update Event
export const updateEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      startDate,
      endDate,
      category,
      calendarId,
      targetRoles,
      location,
      color,
      courseCode,
      isAllDay,
    } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Event ID is required.",
      });
      return;
    }

    const event = await findEventByIdOrCustomId(id);
    if (!event) {
      res.status(404).json({
        success: false,
        message: "Event not found.",
      });
      return;
    }

    const effectiveDate = date !== undefined ? date : event.date;
    const effectiveStartTime = startTime !== undefined ? startTime : event.startTime;
    const effectiveEndTime = endTime !== undefined ? endTime : event.endTime;

    const { start, end } = computeEventDates(
      effectiveDate,
      effectiveStartTime,
      effectiveEndTime,
      startDate !== undefined ? startDate : event.startDate,
      endDate !== undefined ? endDate : event.endDate
    );

    const updateFields: Record<string, any> = {
      startDate: start,
      endDate: end,
    };

    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (date !== undefined) updateFields.date = date;
    if (startTime !== undefined) updateFields.startTime = startTime;
    if (endTime !== undefined) updateFields.endTime = endTime;
    if (category !== undefined) updateFields.category = category;
    if (calendarId !== undefined) updateFields.calendarId = calendarId;
    if (targetRoles !== undefined) updateFields.targetRoles = targetRoles;
    if (location !== undefined) updateFields.location = location;
    if (color !== undefined) updateFields.color = color;
    if (courseCode !== undefined) updateFields.courseCode = courseCode;
    if (isAllDay !== undefined) updateFields.isAllDay = isAllDay;

    const updatedEvent = await Event.findByIdAndUpdate(event._id, updateFields, {
      returnDocument: "after",
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Event updated successfully.",
      data: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Event
export const deleteEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Event ID is required.",
      });
      return;
    }

    const event = await findEventByIdOrCustomId(id);
    if (!event) {
      res.status(404).json({
        success: false,
        message: "Event not found.",
      });
      return;
    }

    await Event.findByIdAndDelete(event._id);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully.",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

