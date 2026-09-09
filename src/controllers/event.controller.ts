import { Request, Response, NextFunction } from "express";
import { Event } from "../models/Event";
import mongoose from "mongoose";

// Create Event
export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      category,
      location,
      color,
      courseCode,
      isAllDay,
      createdBy,
    } = req.body;

    if (!title || !startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: "Title, start date, and end date are required fields.",
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid date format.",
      });
      return;
    }

    if (start > end) {
      res.status(400).json({
        success: false,
        message: "Start date must be before end date.",
      });
      return;
    }

    const event = new Event({
      title,
      description,
      startDate: start,
      endDate: end,
      category,
      location,
      color,
      courseCode,
      isAllDay,
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

// Get All Events (with filtering)
export const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, category, courseCode } = req.query;
    const filter: Record<string, any> = {};

    if (category) {
      filter.category = category;
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
          // Event end date should be after or equal to the start filter
          filter.$and.push({ endDate: { $gte: start } });
        }
      }

      if (endDate) {
        const end = new Date(endDate as string);
        if (!isNaN(end.getTime())) {
          // Event start date should be before or equal to the end filter
          filter.$and.push({ startDate: { $lte: end } });
        }
      }
    }

    const events = await Event.find(filter).sort({ startDate: 1 });
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

// Get Event By ID
export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid event ID format.",
      });
      return;
    }

    const event = await Event.findById(id);
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
      startDate,
      endDate,
      category,
      location,
      color,
      courseCode,
      isAllDay,
    } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid event ID format.",
      });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({
        success: false,
        message: "Event not found.",
      });
      return;
    }

    const updatedStart = startDate ? new Date(startDate) : event.startDate;
    const updatedEnd = endDate ? new Date(endDate) : event.endDate;

    if (isNaN(updatedStart.getTime()) || isNaN(updatedEnd.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid date format.",
      });
      return;
    }

    if (updatedStart > updatedEnd) {
      res.status(400).json({
        success: false,
        message: "Start date must be before end date.",
      });
      return;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        title: title !== undefined ? title : event.title,
        description: description !== undefined ? description : event.description,
        startDate: updatedStart,
        endDate: updatedEnd,
        category: category !== undefined ? category : event.category,
        location: location !== undefined ? location : event.location,
        color: color !== undefined ? color : event.color,
        courseCode: courseCode !== undefined ? courseCode : event.courseCode,
        isAllDay: isAllDay !== undefined ? isAllDay : event.isAllDay,
      },
      { returnDocument: "after", runValidators: true }
    );

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
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid event ID format.",
      });
      return;
    }

    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      res.status(404).json({
        success: false,
        message: "Event not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Event deleted successfully.",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};
