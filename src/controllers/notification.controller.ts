import { Request, Response } from "express";
import Notification from "../models/Notification.model";

// GET /api/notifications
export async function getNotifications(req: Request, res: Response) {
  try {
    const { userId, role, limit } = req.query;

    const orConditions: any[] = [{ recipientId: "all" }, { recipientRole: "all" }];
    if (userId) orConditions.push({ recipientId: userId });
    if (role) orConditions.push({ recipientRole: role });

    const maxLimit = Math.min(50, Number(limit) || 20);

    const notifications = await Notification.find({ $or: orConditions })
      .sort({ createdAt: -1 })
      .limit(maxLimit);

    const unreadCount = await Notification.countDocuments({
      $or: orConditions,
      isRead: false,
    });

    return res.json({ success: true, data: notifications, unreadCount });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch notifications" });
  }
}

// PUT /api/notifications/:id/read - Mark one as read
export async function markAsRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { $set: { isRead: true } });
    return res.json({ success: true, message: "Marked as read" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update notification" });
  }
}

// PUT /api/notifications/read-all - Mark all as read for user
export async function markAllAsRead(req: Request, res: Response) {
  try {
    const { userId, role } = req.body;
    const orConditions: any[] = [{ recipientId: "all" }, { recipientRole: "all" }];
    if (userId) orConditions.push({ recipientId: userId });
    if (role) orConditions.push({ recipientRole: role });

    await Notification.updateMany({ $or: orConditions, isRead: false }, { $set: { isRead: true } });
    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to mark all as read" });
  }
}
