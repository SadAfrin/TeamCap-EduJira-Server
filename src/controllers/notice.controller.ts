import { Request, Response } from "express";
import Notice from "../models/Notice.model";
import { sendNotificationAndEmit } from "../lib/socket";

// GET /api/notices - Get active notices (with role & class filters)
export async function getAllNotices(req: Request, res: Response) {
  try {
    const { role, className, category, includeDeleted } = req.query;
    const filter: Record<string, any> = {};

    if (includeDeleted !== "true") {
      filter.isDeleted = false;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    // Role targeting: if role specified (e.g. 'student'), show 'all' OR targetRole: 'student'
    if (role && role !== "admin") {
      const conditions: any[] = [
        { targetType: "all" },
        { targetRole: { $in: ["all", role] } },
      ];
      if (className && className !== "All") {
        conditions.push({ targetType: "class", className });
      }
      filter.$or = conditions;
    }

    const notices = await Notice.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: notices, count: notices.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch notices" });
  }
}

// POST /api/notices - Admin create notice
export async function createNotice(req: Request, res: Response) {
  try {
    const { title, body, targetType, className, targetRole, category, priority, createdBy } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: "Title and Body are required." });
    }

    const notice = await Notice.create({
      title,
      body,
      targetType: targetType || "all",
      className: targetType === "class" ? className : "",
      targetRole: targetType === "role" ? targetRole : "all",
      category: category || "General",
      priority: priority || "normal",
      createdBy: createdBy || "Administrator",
      isDeleted: false,
      translations: {},
    });

    // Broadcast notification based on targeting
    let targetRoom: string | undefined = undefined;
    if (targetType === "class" && className) {
      targetRoom = `class_${className}`;
    } else if (targetType === "role" && targetRole && targetRole !== "all") {
      targetRoom = `role_${targetRole}`;
    }

    await sendNotificationAndEmit({
      recipientId: "all",
      recipientRole: targetType === "role" ? targetRole : "all",
      type: "notice",
      title: `Notice: ${title}`,
      message: body.slice(0, 100) + (body.length > 100 ? "..." : ""),
      link: "/dashboard/notices",
      room: targetRoom,
    });

    return res.status(201).json({ success: true, message: "Notice published successfully", data: notice });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to publish notice" });
  }
}

// PUT /api/notices/:id - Admin update notice
export async function updateNotice(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const notice = await Notice.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    return res.json({ success: true, message: "Notice updated", data: notice });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update notice" });
  }
}

// DELETE /api/notices/:id - Admin soft delete
export async function deleteNotice(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    if (hard === "true") {
      await Notice.findByIdAndDelete(id);
      return res.json({ success: true, message: "Notice permanently deleted" });
    }

    const notice = await Notice.findByIdAndUpdate(id, { $set: { isDeleted: true } }, { new: true });
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    return res.json({ success: true, message: "Notice soft deleted", data: notice });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete notice" });
  }
}

// POST /api/notices/:id/translate-cache - Save translated version into notice cache
export async function cacheTranslation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { lang, title, body } = req.body;

    if (!lang || !title || !body) {
      return res.status(400).json({ success: false, message: "lang, title, body required" });
    }

    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    if (!notice.translations) {
      notice.translations = {};
    }
    notice.translations.set(lang, { title, body });
    await notice.save();

    return res.json({ success: true, message: "Translation cached successfully", data: notice });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to cache translation" });
  }
}
