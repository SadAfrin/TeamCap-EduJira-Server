import { Request, Response, NextFunction } from "express";
import { Calendar } from "../models/Calendar";
import { Event } from "../models/Event";
import mongoose from "mongoose";

// Helper to find a calendar category by _id or customId
const findCalendarByIdOrCustomId = async (id: string) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byId = await Calendar.findById(id);
    if (byId) return byId;
  }
  return await Calendar.findOne({ customId: id });
};

// Get All Calendars
export const getAllCalendars = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role } = req.query;
    const filter: Record<string, any> = {};

    if (role) {
      filter.targetRoles = role;
    }

    const calendars = await Calendar.find(filter).sort({ createdAt: 1 });
    res.status(200).json({
      success: true,
      count: calendars.length,
      data: calendars,
    });
  } catch (error) {
    next(error);
  }
};

// Create Single Calendar Category
export const createCalendar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, customId, name, color, description, targetRoles, isDefault } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: "Calendar name is required.",
      });
      return;
    }

    const calendar = new Calendar({
      customId: customId || id,
      name,
      color: color || "indigo",
      description: description || "",
      targetRoles: Array.isArray(targetRoles) && targetRoles.length > 0
        ? targetRoles
        : ["admin", "teacher", "student", "parent"],
      isDefault: !!isDefault,
    });

    await calendar.save();
    res.status(201).json({
      success: true,
      message: "Calendar category created successfully.",
      data: calendar,
    });
  } catch (error) {
    next(error);
  }
};

// Bulk Create Calendars (for seeding default categories)
export const createBulkCalendars = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { calendars } = req.body;

    if (!Array.isArray(calendars) || calendars.length === 0) {
      res.status(400).json({
        success: false,
        message: "calendars array is required and must not be empty.",
      });
      return;
    }

    const validatedCalendars = calendars.map((c: any) => ({
      customId: c.id || c.customId,
      name: c.name,
      color: c.color || "indigo",
      description: c.description || "",
      targetRoles: Array.isArray(c.targetRoles) && c.targetRoles.length > 0
        ? c.targetRoles
        : ["admin", "teacher", "student", "parent"],
      isDefault: !!c.isDefault,
    }));

    const createdCalendars = await Calendar.insertMany(validatedCalendars);
    res.status(201).json({
      success: true,
      message: `Successfully created ${createdCalendars.length} calendar categories.`,
      data: createdCalendars,
    });
  } catch (error) {
    next(error);
  }
};

// Get Calendar Category By ID
export const getCalendarById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Calendar ID is required.",
      });
      return;
    }

    const calendar = await findCalendarByIdOrCustomId(id);
    if (!calendar) {
      res.status(404).json({
        success: false,
        message: "Calendar category not found.",
      });
      return;
    }

    res.status(200).json({ success: true, data: calendar });
  } catch (error) {
    next(error);
  }
};

// Update Calendar Category
export const updateCalendar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, color, description, targetRoles } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Calendar ID is required.",
      });
      return;
    }

    const calendar = await findCalendarByIdOrCustomId(id);
    if (!calendar) {
      res.status(404).json({
        success: false,
        message: "Calendar category not found.",
      });
      return;
    }

    const updateFields: Record<string, any> = {};
    if (name !== undefined) updateFields.name = name;
    if (color !== undefined) updateFields.color = color;
    if (description !== undefined) updateFields.description = description;
    if (targetRoles !== undefined) updateFields.targetRoles = targetRoles;

    const updated = await Calendar.findByIdAndUpdate(calendar._id, updateFields, {
      returnDocument: "after",
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Calendar category updated successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Calendar Category and Associated Events
export const deleteCalendar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Calendar ID is required.",
      });
      return;
    }

    const calendar = await findCalendarByIdOrCustomId(id);
    if (!calendar) {
      res.status(404).json({
        success: false,
        message: "Calendar category not found.",
      });
      return;
    }

    // Delete category
    await Calendar.findByIdAndDelete(calendar._id);

    // Also delete events linked to this calendar (by customId or mongoId)
    const identifiers = [calendar._id.toString()];
    if (calendar.customId) identifiers.push(calendar.customId);

    await Event.deleteMany({ calendarId: { $in: identifiers } });

    res.status(200).json({
      success: true,
      message: "Calendar category and associated events deleted successfully.",
      data: calendar,
    });
  } catch (error) {
    next(error);
  }
};
